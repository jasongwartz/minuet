import * as Tone from 'tone'

export const getSamples = async () => {
  const metadataResponse = await fetch('/samples/list')
  return (await metadataResponse.json()) as { name: string; url: string }[]
}

export type SampleDetails = Awaited<ReturnType<typeof getSamples>>[number]

export const loadSamples = async (samples: SampleDetails[]) =>
  Promise.all(
    samples.map(async (sample) => {
      console.log(`loading: ${sample.name}`)
      const player = new Tone.Player()

      // TODO: Instead of loading directly from URL, pull binary first,
      // and read-through cache in IndexedDB (browser storage for blobs)
      await player.load(sample.url)
      console.log(`loaded: ${sample.name}`)

      return { ...sample, player }
    }),
  )
