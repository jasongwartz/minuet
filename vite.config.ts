import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { join } from 'path'
import { createReadStream } from 'fs'
import { readdir } from 'fs/promises'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'local-samples',
      async configureServer(server) {
        const files = await readdir(join(__dirname, 'public/samples'))
        server.middlewares.use('/samples/list', async (_, res) => {
          res.end(
            JSON.stringify(
              files.map((fp) => ({ name: fp, url: `/samples/${encodeURIComponent(fp)}` })),
            ),
          )
        })
        server.middlewares.use((req, res, next) => {
          if (req.url.includes('/samples') && req.url.endsWith('.wav')) {
            const filePath = join(
              __dirname,
              'public/',
              decodeURIComponent(req.url.match(/.+\/(.*.wav)/)[0]),
            )
            console.log('returning sample at:', filePath)
            const stream = createReadStream(filePath)
            stream.on('error', next)
            stream.pipe(res)
          } else {
            next()
          }
        })
      },
    },
  ],
})
