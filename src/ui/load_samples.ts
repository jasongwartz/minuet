import wasmURL from '@ffmpeg/core/wasm?url'
import coreURL from '@ffmpeg/core?url'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import * as Tone from 'tone'

export const getSamples = async () => {
  const metadataResponse = await fetch('/samples/list')
  return (await metadataResponse.json()) as { name: string; url: string }[]
}

export type SampleDetails = Awaited<ReturnType<typeof getSamples>>[number]

export const loadSample = async (sample: SampleDetails) => {
  console.log(`loading: ${sample.name}`)
  const player = new Tone.Player()

  if (sample.url.endsWith('caf')) {
    await player.load(await convertCafToMp3(sample))
  } else {
    await player.load(sample.url)
  }

  // TODO: Instead of loading directly from URL, pull binary first,
  // and read-through cache in IndexedDB (browser storage for blobs)
  console.log(`loaded: ${sample.name}`)

  return { ...sample, player }
}

const ffmpeg = (async () => {
  const ffmpeg = new FFmpeg()
  await ffmpeg.load({
    coreURL,
    wasmURL,
  })
  return ffmpeg
})()

const convertCafToMp3 = async (sample: SampleDetails) => {
  const ff = await ffmpeg

  await ff.writeFile(sample.name, await fetchFile(sample.url))
  await ff.exec(['-i', sample.name, sample.name + '.mp3'])

  const fileData = await ff.readFile(sample.name + '.mp3')

  return fileData instanceof Uint8Array
    ? URL.createObjectURL(new Blob([fileData.buffer], { type: 'audio/mp3' }))
    : fileData
}
