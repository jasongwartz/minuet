import wasmURL from '@ffmpeg/core/wasm?url'
import coreURL from '@ffmpeg/core?url'
import { FFmpeg } from '@ffmpeg/ffmpeg'
import { fetchFile } from '@ffmpeg/util'
import * as Tone from 'tone'

import { db } from './idb'

export const getSamples = async () => {
  const metadataResponse = await fetch('/samples/list')
  return (await metadataResponse.json()) as { name: string; url: string }[]
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
    await player.load(await convertCafToMp3(sample.name, blobUrl))
  } else {
    await player.load(blobUrl)
  }

  console.log(`loaded: ${sample.name}`)
  return { ...sample, player }
}

let ffmpeg: FFmpeg | null = null

const convertCafToMp3 = async (name: string, url: string) => {
  if (ffmpeg === null) {
    ffmpeg = new FFmpeg()
    await ffmpeg.load({
      coreURL,
      wasmURL,
    })
  }
  await ffmpeg.writeFile(name, await fetchFile(url))
  await ffmpeg.exec(['-i', name, name + '.mp3'])

  const fileData = await ffmpeg.readFile(name + '.mp3')

  return fileData instanceof Uint8Array
    ? URL.createObjectURL(new Blob([fileData.buffer], { type: 'audio/mp3' }))
    : fileData
}
