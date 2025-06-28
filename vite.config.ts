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
          if (req.url?.includes('/samples')) {
            const pathComponents = req.url.split('/')
            const filename = pathComponents[pathComponents.length - 1]
            const decodedFilename = decodeURIComponent(filename)
            
            if (decodedFilename.endsWith('.wav')) {
              // Serve WAV files directly
              const filePath = join(__dirname, 'public/samples/', decodedFilename)
              console.log('returning sample at:', filePath)
              const stream = createReadStream(filePath)
              stream.on('error', next)
              stream.pipe(res)
            } else if (decodedFilename.endsWith('.caf')) {
              // Convert CAF files transparently
              (async (): Promise<void> => {
                try {
                  const filePath = join(__dirname, 'public/samples/', decodedFilename)
                  console.log('converting CAF file:', filePath)
                  
                  // Dynamic imports for FFmpeg modules
                  const ffmpegModule = await import('@ffmpeg/ffmpeg')
                  const utilModule = await import('@ffmpeg/util')
                  
                  // Extract from modules
                  const { FFmpeg } = ffmpegModule
                  const { fetchFile } = utilModule
                  
                  // Initialize FFmpeg
                  const ffmpeg = new FFmpeg()
                  await ffmpeg.load()
                  
                  // Load the CAF file
                  const fileData = await fetchFile(filePath)
                  const inputName = 'input.caf'
                  const outputName = 'output.mp3'
                  
                  await ffmpeg.writeFile(inputName, new Uint8Array(fileData))
                  await ffmpeg.exec(['-i', inputName, outputName])
                  const outputData = await ffmpeg.readFile(outputName)
                  
                  if (outputData instanceof Uint8Array) {
                    res.setHeader('Content-Type', 'audio/mp3')
                    res.setHeader('Content-Length', outputData.length.toString())
                    res.end(Buffer.from(outputData))
                  } else {
                    throw new Error('Unexpected output format')
                  }
                } catch (error) {
                  console.error('CAF conversion error:', error)
                  res.statusCode = 500
                  res.end(`CAF conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
                }
              })().catch(next)
            } else {
              next()
            }
          } else {
            next()
          }
        })
      },
    },
  ],
})
