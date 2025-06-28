import * as Tone from 'tone'

import { db } from './idb'

interface SampleMetadata {
  name: string
  url: string
}

export const getSamples = async (): Promise<SampleMetadata[]> => {
  const metadataResponse = await fetch('/samples/list')
  const data: unknown = await metadataResponse.json()

  // Validate the data structure
  if (!Array.isArray(data)) {
    return []
  }

  const validSamples: SampleMetadata[] = []

  for (const item of data) {
    if (typeof item === 'object' && item !== null && 'name' in item && 'url' in item) {
      // Use Reflect.get to avoid type assertions
      const nameValue: unknown = Reflect.get(item, 'name')
      const urlValue: unknown = Reflect.get(item, 'url')

      if (typeof nameValue === 'string' && typeof urlValue === 'string') {
        validSamples.push({
          name: nameValue,
          url: urlValue,
        })
      }
    }
  }

  return validSamples
}

export type SampleDetails = Awaited<ReturnType<typeof getSamples>>[number]

export const loadSample = async (sample: SampleDetails) => {
  console.log(`loading: ${sample.name}`)
  const player = new Tone.Player()

  // TODO: Dexie supports reactivity - move some of this fetch logic to
  // the Sidebar component.
  const cached = await db.samples.where('url').equals(sample.url).first()
  let blob: Blob
  if (cached) {
    blob = cached.blob
  } else {
    const response = await fetch(sample.url)
    blob = await response.blob()
    await db.samples.put({
      name: sample.name,
      url: sample.url,
      blob,
    })
  }
  const blobUrl = URL.createObjectURL(blob)

  if (sample.url.endsWith('caf')) {
    try {
      await player.load(await convertCafToMp3(sample.name, blobUrl))
    } catch (error) {
      console.warn(`Cannot load CAF file ${sample.name}:`, error)
      throw new Error(
        `CAF file support requires FFmpeg. Please install optional dependencies: npm install @ffmpeg/core @ffmpeg/ffmpeg @ffmpeg/util, or convert ${sample.name} to MP3/WAV format.`,
      )
    }
  } else {
    await player.load(blobUrl)
  }
  URL.revokeObjectURL(blobUrl)

  console.log(`loaded: ${sample.name}`)
  return { ...sample, player }
}

// Simple CAF to MP3 conversion with error for missing FFmpeg
const convertCafToMp3 = async (name: string, url: string): Promise<string> => {
  try {
    // Try to dynamically import FFmpeg modules
    const [ffmpegModule, utilModule, coreModule, wasmModule] = await Promise.all([
      import('@ffmpeg/ffmpeg'),
      import('@ffmpeg/util'),
      import('@ffmpeg/core?url'),
      import('@ffmpeg/core/wasm?url'),
    ])

    // Use the modules directly without complex typing
    const { FFmpeg } = ffmpegModule
    const { fetchFile } = utilModule

    const ffmpeg = new FFmpeg()
    await ffmpeg.load({
      coreURL: coreModule.default,
      wasmURL: wasmModule.default,
    })

    const fileData = await fetchFile(url)
    await ffmpeg.writeFile(name, new Uint8Array(fileData))
    await ffmpeg.exec(['-i', name, name + '.mp3'])
    const outputData = await ffmpeg.readFile(name + '.mp3')

    if (outputData instanceof Uint8Array) {
      return URL.createObjectURL(new Blob([outputData.buffer], { type: 'audio/mp3' }))
    }

    throw new Error('Unexpected output format from FFmpeg')
  } catch (error) {
    throw new Error(
      `FFmpeg not available. Install optional dependencies: npm install @ffmpeg/core @ffmpeg/ffmpeg @ffmpeg/util, or convert ${name} to MP3/WAV format. Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    )
  }
}
