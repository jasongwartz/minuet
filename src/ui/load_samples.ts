import * as Tone from 'tone'
import { z } from 'zod'

import { db } from './idb'

const zSampleMetadata = z.object({
  name: z.string(),
  url: z.string(),
})

type SampleMetadata = z.infer<typeof zSampleMetadata>

export const getSamples = async (): Promise<SampleMetadata[]> =>
  fetch('/samples/list')
    .then((response) => response.json())
    .then((data) =>
      Array.isArray(data)
        ? data
            .map((item) => zSampleMetadata.safeParse(item))
            .filter((result) => result.success)
            .map((result) => result.data)
        : [],
    )

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
