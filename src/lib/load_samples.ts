import * as Tone from 'tone'

export const getSamples = async () => {
  const metadataResponse = await fetch('https://chopsticks.vercel.app/static/sampledata.json')
  const metadata = await metadataResponse.json() as Record<string, { file: string, category: string }>
  return Object.entries(metadata).map((entry) => {
    return { ...entry[1], name: entry[0] }
  })
}

export type SampleDetails = Awaited<ReturnType<typeof getSamples>>[number]

export const loadSamples = async (samples: SampleDetails[]) =>  Promise.all(samples.map(async (sample) => {
  console.log(`loading: ${sample.name}`)
  const player =  new Tone.Player()

  // TODO: Instead of loading directly from URL, pull binary first,
  // and read-through cache in IndexedDB (browser storage for blobs)
  await player.load(`https://chopsticks.vercel.app/${sample.file}`)
  console.log(`loaded: ${sample.name}`)

  return { ...sample, player }
}))
