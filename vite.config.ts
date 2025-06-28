import react from '@vitejs/plugin-react'
import { execFile } from 'child_process'
import { createReadStream } from 'fs'
import { access, mkdtemp, readdir } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import { promisify } from 'util'
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
  plugins: [
    react(),
    tsconfigPaths(),
    {
      name: 'local-samples',
      async configureServer(server) {
        const files = await readdir(join(__dirname, 'public/samples')).catch(() => [])
        const transcodingTempDir = await mkdtemp(join(tmpdir(), 'transcoding-'))
        const ffmpegAvailable = await promisify(execFile)('ffmpeg', ['-version']).then(
          () => true,
          () => false,
        )
        const execFileAsync = promisify(execFile)

        server.middlewares.use('/samples/list', (_, res) => {
          res.end(
            JSON.stringify(
              files.map((fp) => ({ name: fp, url: `/samples/${encodeURIComponent(fp)}` })),
            ),
          )
        })
        server.middlewares.use('/samples', (req, res, next) => {
          if (!req.url) {
            next()
            return
          }
          const pathComponents = req.url.split('/')
          const filename = pathComponents[pathComponents.length - 1]
          const decodedFilename = decodeURIComponent(filename)
          const filePath = join(__dirname, 'public/samples/', decodedFilename)
          if (decodedFilename.endsWith('.wav')) {
            // Serve WAV files directly
            console.log('returning sample at:', filePath)
            res.setHeader('Content-Type', 'audio/wav')
            const stream = createReadStream(filePath)
            stream.on('error', next)
            stream.pipe(res)
          } else if (decodedFilename.endsWith('.caf')) {
            if (!ffmpegAvailable) {
              res.statusCode = 500
              res.end(
                'CAF conversion failed: FFmpeg not found. Please install FFmpeg on your system.',
              )
              return
            }
            // Convert CAF files transparently using system FFmpeg
            const outputFilename = decodedFilename.replace('.caf', '.mp3')
            const outputPath = join(transcodingTempDir, outputFilename)
            void access(outputPath)
              .catch(async () => {
                const start = Date.now()
                await execFileAsync('ffmpeg', ['-i', filePath, '-acodec', 'mp3', outputPath])
                console.log(`Transcoded file "${filePath}" in ${Date.now() - start}ms`)
              })
              .then(() => {
                res.setHeader('Content-Type', 'audio/mp3')
                const stream = createReadStream(outputPath)
                stream.on('error', next)
                stream.pipe(res)
              })
          } else {
            next()
          }
        })
      },
    },
  ],
})
