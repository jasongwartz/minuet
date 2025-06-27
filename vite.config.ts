import react from '@vitejs/plugin-react'
import { createReadStream } from 'fs'
import { readdir } from 'fs/promises'
import { join } from 'path'
import tsconfigPaths from 'vite-tsconfig-paths'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    server: {
      deps: {
        external: ['typescript'],
      },
    },
  },
  optimizeDeps: {
    exclude: ['@ffmpeg/ffmpeg', '@ffmpeg/util'],
  },
  plugins: [
    react(),
    tsconfigPaths(),
    {
      name: 'local-samples',
      async configureServer(server) {
        const files = await readdir(join(__dirname, 'public/samples')).catch(() => [])
        server.middlewares.use('/samples/list', (_, res) => {
          res.end(
            JSON.stringify(
              files.map((fp) => ({ name: fp, url: `/samples/${encodeURIComponent(fp)}` })),
            ),
          )
        })
        server.middlewares.use((req, res, next) => {
          if (req.url?.includes('/samples') && req.url.endsWith('.wav')) {
            const pathComponents = req.url.split('/')
            const wavFilename = pathComponents[pathComponents.length - 1]
            const filePath = join(__dirname, 'public/samples/', decodeURIComponent(wavFilename))
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
