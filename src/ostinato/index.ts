import * as Tone from 'tone'
import type { Transport } from 'tone/build/esm/core/clock/Transport'

import type { Instrument, OstinatoSchema } from './schema'

export type { Instrument, OstinatoSchema }

export class Engine {
  samples: Record<string, Tone.Player>
  instruments: Instrument[]
  loop: Tone.Loop
  transport: Transport

  get started() {
    return this.transport.state === 'started'
  }

  callback = (time: number) => {
    for (const instrument of this.instruments) {
      if ('synth' in instrument) {
        const synth =
          instrument.synth === 'FMSynth'
            ? new Tone.FMSynth().toDestination()
            : new Tone.AMSynth().toDestination()
        for (const note of instrument.on.sort()) {
          synth.triggerAttackRelease('C4', '8n', time + Tone.Time(note).toSeconds())
        }
      }
      console.log('processing instrument', instrument)
      if ('sample' in instrument) {
        console.log('of type sample')
        console.log(this.samples)
        if (!(instrument.sample.name in this.samples)) {
          throw new Error('Sample name unknown!')
        }
        const sample = this.samples[instrument.sample.name]

        const effects = instrument.with.map((effect) => {
          switch (effect.name) {
            case 'flanger':
              return new Tone.Distortion(0.4)
            case 'lpf':
              return new Tone.Filter('C6', 'lowpass')
          }
        })

        console.log(
          instrument.sample,
          'chain: ',
          effects.map((e) => e.name),
        )

        // Whatever the previous chain was, disconnect it to avoid duplicate outputs
        // and to allow removing of effects from samples that previously had them.
        sample.disconnect()

        sample.chain(...effects, Tone.Destination)
        const player = sample.toDestination()

        /*
        // HOW TO IMPLEMENT stretching sample to a whole bar
        console.log(player.toSeconds('4n'), player.buffer.duration, player.sampleTime / player.toSeconds('1:0:0'))
        player.playbackRate = player.buffer.duration / player.toSeconds('1:0:0')
        */
        if (instrument.sample.stretchTo) {
          player.playbackRate =
            player.buffer.duration / player.toSeconds(instrument.sample.stretchTo)
          console.log(
            `Set player playback rate to ${player.playbackRate} (to fit buffer duration ${player.buffer.duration} into time ${instrument.sample.stretchTo}, which is ${player.toSeconds(instrument.sample.stretchTo)} seconds)`,
          )
        }

        for (const note of instrument.on.sort()) {
          console.log(
            `scheduling ${instrument.sample.name} at beat ${note} which is ${Tone.Time(note).toSeconds()} from now (which is ${time}) for a result of time ${time + Tone.Time(note).toSeconds()}`,
          )
          player.start(time + Tone.Time(note).toSeconds())
        }
      }
    }
  }

  constructor(samples: Record<string, Tone.Player>) {
    this.instruments = []
    this.samples = samples
    this.loop = new Tone.Loop(this.callback, '4m')
    this.transport = Tone.Transport
    this.transport.bpm.value = 70
  }

  async start() {
    await Tone.start()
    // Tone.Transport.timeSignature = [22, 8]
    console.log(Tone.Transport.timeSignature)
    this.transport.start()
    this.loop.start(0)
  }
}
