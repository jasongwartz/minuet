import * as Tone from 'tone'
import type { Transport } from 'tone/build/esm/core/clock/Transport'

import type { Instrument } from '../../.out/main.pkl'

export class Engine {
  samples: Record<string, Tone.Player>
  instruments: Instrument[]
  loop: Tone.Loop
  transport: Transport

  get started () {
    return this.transport.state === 'started'
  }

  callback = (time: number) => {
    for (const instrument of this.instruments) {
      if (instrument.synth) {
        const synth =
            instrument.synth === 'FMSynth'
              ? new Tone.FMSynth().toDestination()
              : new Tone.AMSynth().toDestination()
        for (const note of instrument.on.sort()) {
          synth.triggerAttackRelease(
            'C4',
            '8n',
            time + Tone.Time(note).toSeconds(),
          )
        }
      }
      if (instrument.sample) {
        const sample = this.samples[instrument.sample]

        const effects = instrument.with.map((name) => {
          switch (name) {
            case 'flanger': return new Tone.Distortion(0.4)
            case 'lpf': return new Tone.Filter('C6', 'lowpass')
          }
        })
          .filter((e): e is Tone.Distortion => e !== undefined)

        console.log(instrument.sample, 'chain: ', effects.map((e) => e.name))

        // Whatever the previous chain was, disconnect it to avoid duplicate outputs
        // and to allow removing of effects from samples that previously had them.
        sample.disconnect()

        sample.chain(...effects, Tone.Destination)
        const player = sample.toDestination()

        for (const note of instrument.on.sort()) {
          console.log(`scheduling ${instrument.sample} at beat ${note} which is ${Tone.Time(note).toSeconds()} from now (which is ${time}) for a result of time ${time + Tone.Time(note).toSeconds()}`)
          player.start(time + Tone.Time(note).toSeconds())
        }
      }
    }
  }

  constructor(samples: Record<string, Tone.Player>) {
    console.log('init')
    this.instruments = []
    this.samples = samples
    this.loop = new Tone.Loop(this.callback, '4m')
    this.transport = Tone.Transport
  }

  async start() {
    await Tone.start()
    // Tone.Transport.timeSignature = [22, 8]
    console.log(Tone.Transport.timeSignature)
    this.transport.start()
    this.loop.start(0)
  }
}


export const getSamples = async () => {
  const metadataResponse = await fetch('https://chopsticks.vercel.app/static/sampledata.json')
  const metadata = await metadataResponse.json() as Record<string, { file: string, category: string }>
  return Object.entries(metadata).map((entry) => {
    return { ...entry[1], name: entry[0] }
  })
}

export type SampleDetails = Awaited<ReturnType<typeof getSamples>>[number]
