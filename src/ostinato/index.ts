import * as Tone from 'tone'
import type { TransportClass } from 'tone/build/esm/core/clock/Transport'
import { WebMidi as WM } from 'webmidi'

import type { EffectName, EffectValueFrom, Instrument, OstinatoSchema } from './schema'

export type { Instrument, OstinatoSchema }

export class Engine {
  samples: Record<string, Tone.Player>
  instruments: Instrument[]
  loop: Tone.Loop
  transport: TransportClass
  webMidi: typeof WM

  get started() {
    return this.transport.state === 'started'
  }

  // TODO: pre-collect all the playback, and only schedule if no errors
  // during planning (otherwise keep playing what was previously scheduled).
  // That, or schedule everything except the instruments that had errors?
  callback = (time: number) => {
    for (const instrument of this.instruments) {
      console.log('processing instrument', instrument)
      if ('synth' in instrument) {
        const synth =
          instrument.synth === 'FMSynth'
            ? new Tone.FMSynth().toDestination()
            : new Tone.AMSynth().toDestination()
        for (const note of instrument.on.sort()) {
          synth.triggerAttackRelease('C4', '8n', time + Tone.Time(note).toSeconds())
        }
      }

      if ('sample' in instrument) {
        const sample = this.samples[instrument.sample.name]
        if (!sample) {
          throw new Error('Sample name unknown!')
        }

        const effects = instrument.with.map((effect) => {
          console.debug('Processing effect', effect)

          let valueFrom: EffectValueFrom | null
          let midiInputNumber: number | null

          if (typeof effect.value === 'object') {
            valueFrom = effect.value
            console.log('inputs length', this.webMidi.inputs.length)
            if (this.webMidi.inputs.length === 1) {
              midiInputNumber = 0
            } else if (valueFrom.from.input) {
              midiInputNumber = valueFrom.from.input
            } else {
              throw new Error('from.input is required when more than 1 MIDI device is connected')
            }
          } else {
            valueFrom = null
            midiInputNumber = null
          }
          const midiInput = midiInputNumber !== null ? this.webMidi.inputs[midiInputNumber] : null
          console.log('midi input selected', midiInput)

          type Effects = Tone.Distortion | Tone.Filter | Tone.Gain

          interface Effect<T extends Effects> {
            min: number
            max: number
            default: number
            node: (startValue: number) => T
            update: (node: T, newValue: number) => void
          }

          const createEffect = <T extends Effects>(effect: Effect<T>): Effect<T> => effect

          const effects: Record<EffectName, Effect<any>> = {
            distortion: createEffect({
              default: 0,
              min: 0,
              max: 1,
              node: (v): Tone.Distortion => new Tone.Distortion(v),
              update: (n, v) => {
                n.distortion = v
              },
            }),

            lpf: createEffect({
              default: Tone.Frequency('C8').toFrequency(),
              min: Tone.Frequency('C2').toFrequency(),
              max: Tone.Frequency('C8').toFrequency(),
              node: (v) => new Tone.Filter(v, 'lowpass'),
              update: (n, v) => {
                n.frequency.value = v
              },
            }),
            hpf: createEffect({
              default: Tone.Frequency('C1').toFrequency(),
              min: Tone.Frequency('C1').toFrequency(),
              max: Tone.Frequency('C8').toFrequency(),
              node: (v) => new Tone.Filter(v, 'highpass'),
              update: (n, v) => {
                n.frequency.value = v
              },
            }),
            gain: createEffect({
              default: 1,
              min: 0,
              max: 1,
              node: (v) => new Tone.Gain(v),
              update: (n, v) => {
                n.gain.value = v
              },
            }),
          }

          const e = effects[effect.name]
          const min = valueFrom?.from.min
            ? typeof valueFrom.from.min === 'string'
              ? Tone.Frequency(valueFrom.from.min).toFrequency()
              : valueFrom.from.min
            : e.min
          const max = valueFrom?.from.max
            ? typeof valueFrom.from.max === 'string'
              ? Tone.Frequency(valueFrom.from.max).toFrequency()
              : valueFrom.from.max
            : e.max

          const startValue =
            typeof effect.value === 'number'
              ? effect.value
              : typeof effect.value === 'string'
                ? Tone.Frequency(effect.value).toFrequency()
                : effects[effect.name].default

          const node = effects[effect.name].node(startValue)

          console.log('typeof', typeof effect.value)
          if (typeof effect.value === 'object') {
            const chunkSize = (max - min) / 127
            console.log('chunksize', chunkSize)

            midiInput!.addListener('controlchange', (e) => {
              console.log(e)
              console.log(
                valueFrom?.from.controller,
                e.controller.number,
                valueFrom?.from.controller === e.controller.number,
              )
              if (valueFrom?.from.controller === e.controller.number) {
                node.update((e.rawValue ?? 0) * chunkSize + min)
              }
            })
          }
          return node
        })

        console.log(
          instrument.sample,
          'chain: ',
          effects.map((e) => e.name),
        )

        // Whatever the previous chain was, disconnect it to avoid duplicate outputs
        // and to allow removing of effects from samples that previously had them.
        sample.disconnect()

        sample.chain(...effects, Tone.getDestination())
        const player = sample

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
    this.webMidi = WM
  }

  async start() {
    await Tone.start()
    this.webMidi = await this.webMidi.enable()
    // Tone.Transport.timeSignature = [22, 8]
    console.log(Tone.Transport.timeSignature)
    this.transport.start()
    this.loop.start(0)
  }
}
