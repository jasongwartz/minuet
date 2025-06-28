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
    // CAF files will be transparently converted by server middleware
    const response = await fetch(sample.url)
    blob = await response.blob()
    await db.samples.put({
      name: sample.name,
      url: sample.url,
      blob,
    })
  }
  const blobUrl = URL.createObjectURL(blob)
  await player.load(blobUrl)
  URL.revokeObjectURL(blobUrl)

  console.log(`loaded: ${sample.name}`)
  return { ...sample, player }
}

