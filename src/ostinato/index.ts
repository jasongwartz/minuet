import * as Tone from 'tone'
import type { TransportClass } from 'tone/build/esm/core/clock/Transport'
import { WebMidi as WM } from 'webmidi'

import { EffectWrapper } from './effect'
import type { EffectName, EffectValueFrom, Instrument, OstinatoSchema } from './schema'

export type { Instrument, OstinatoSchema }

export interface Track {
  config: Instrument
  node?: Tone.ToneAudioNode
}

interface Events {
  onEachBeat?: ((phrase: number, bar: number, beat: number) => void) | undefined
  onSchedulingStart?: () => void
  onSchedulingComplete?: (duration: number) => void
}

interface PitchCapture {
  pitch: string
  velocity: number
}

export class Engine {
  samples: Record<string, Tone.Player>
  tracks: Track[]
  config?: OstinatoSchema
  loop: Tone.Loop
  transport: TransportClass
  webMidi: typeof WM
  events?: Events
  pitchCaptures: PitchCapture[] = []
  phrase = 0

  get started() {
    return this.transport.state === 'started'
  }

  // TODO: pre-collect all the playback, and only schedule if no errors
  // during planning (otherwise keep playing what was previously scheduled).
  // That, or schedule everything except the instruments that had errors?
  callback = (time: number) => {
    const start = Date.now()
    this.phrase += 1
    this.events?.onSchedulingStart?.()
    Tone.getTransport().scheduleRepeat((repeatTime) => {
      const currentBeat = Tone.Time(repeatTime).toBarsBeatsSixteenths().split(':')
      this.events?.onEachBeat?.(
        this.phrase,
        parseFloat(currentBeat[0] ?? '0'),
        parseFloat(currentBeat[1] ?? '0'),
      )
    }, '4n')

    if (this.config?.bpm) {
      this.transport.bpm.value = this.config.bpm
    }

    const newTracks = []

    for (const instrument of this.config?.instruments ?? []) {
      if ('synth' in instrument) {
        const synth =
          instrument.synth === 'FMSynth'
            ? new Tone.FMSynth().toDestination()
            : new Tone.AMSynth().toDestination()
        for (const note of instrument.on.sort()) {
          synth.triggerAttackRelease('C4', '8n', time + Tone.Time(note).toSeconds())
        }
      } else {
        if (!(instrument.sample.name in this.samples)) {
          throw new Error(
            `Sample name "${instrument.sample.name}" unknown! Sample names available: ${Object.keys(this.samples).join(', ')}`,
          )
        }
        const sample = this.samples[instrument.sample.name] ?? null

        const effects = instrument.with.map((effect): EffectWrapper<EffectName> => {
          let valueFrom: EffectValueFrom['from'] | null
          let midiInputNumber: number | null

          if ('value' in effect && typeof effect.value === 'object') {
            valueFrom = effect.value.from
            if ('controller' in valueFrom) {
              if (this.webMidi.inputs.length === 1) {
                midiInputNumber = 0
              } else if ('input' in valueFrom && valueFrom.input !== undefined) {
                midiInputNumber = valueFrom.input
              } else {
                throw new Error('from.input is required when more than 1 MIDI device is connected')
              }
            } else {
              midiInputNumber = null
            }
          } else {
            valueFrom = null
            midiInputNumber = null
          }
          const midiInput = midiInputNumber !== null ? this.webMidi.inputs[midiInputNumber] : null

          const e = new EffectWrapper(effect.name)

          const startValue =
            'value' in effect
              ? typeof effect.value === 'number'
                ? effect.value
                : typeof effect.value === 'string'
                  ? Tone.Frequency(effect.value).toFrequency()
                  : e.default
              : e.default

          e.update(startValue)

          if (valueFrom) {
            if ('controller' in valueFrom) {
              const min = valueFrom.min
                ? typeof valueFrom.min === 'string'
                  ? Tone.Frequency(valueFrom.min).toFrequency()
                  : valueFrom.min
                : e.min
              const max = valueFrom.max
                ? typeof valueFrom.max === 'string'
                  ? Tone.Frequency(valueFrom.max).toFrequency()
                  : valueFrom.max
                : e.max

              const chunkSize = (max - min) / 127
              console.log('chunksize', chunkSize)

              midiInput?.addListener('controlchange', (event) => {
                if (valueFrom.controller === event.controller.number) {
                  e.update((event.rawValue ?? 0) * chunkSize + min)
                }
              })
            } else {
              const osc = new Tone.LFO(
                valueFrom.period,
                Tone.Frequency(valueFrom.min).toFrequency(),
                Tone.Frequency(valueFrom.max).toFrequency(),
              )
              e.connect(osc)
              osc.start()
            }
          }
          return e
        })

        // Whatever the previous chain was, disconnect it to avoid duplicate outputs
        // and to allow removing of effects from samples that previously had them.
        sample?.disconnect()

        sample?.chain(...effects.map((e) => e.node), Tone.getDestination())
        newTracks.push({ config: instrument, node: sample ?? undefined })

        /*
        // HOW TO IMPLEMENT stretching sample to a whole bar
        console.log(player.toSeconds('4n'), player.buffer.duration, player.sampleTime / player.toSeconds('1:0:0'))
        player.playbackRate = player.buffer.duration / player.toSeconds('1:0:0')
        */
        if (sample && instrument.sample.stretchTo) {
          sample.playbackRate =
            sample.buffer.duration / sample.toSeconds(instrument.sample.stretchTo)
          console.log(
            `Set player playback rate to ${sample.playbackRate} (to fit buffer duration ${sample.buffer.duration} into time ${instrument.sample.stretchTo}, which is ${sample.toSeconds(instrument.sample.stretchTo)} seconds)`,
          )
        }

        for (const note of instrument.on.sort()) {
          console.log(
            `scheduling ${instrument.sample.name} at beat ${note} which is ${Tone.Time(note).toSeconds()} from now (which is ${time}) for a result of time ${time + Tone.Time(note).toSeconds()}`,
          )
          sample?.start(time + Tone.Time(note).toSeconds())
        }
      }
    }

    this.tracks = newTracks
    this.events?.onSchedulingComplete?.(Date.now() - start)
  }

  constructor(samples: Record<string, Tone.Player>, events?: Events) {
    this.tracks = []
    this.samples = samples
    this.loop = new Tone.Loop(this.callback, '4m')
    this.transport = Tone.getTransport()
    this.transport.bpm.value = 70
    this.webMidi = WM
    this.events = events
  }

  async start() {
    await Tone.start()
    this.webMidi = await this.webMidi.enable()
    this.webMidi.inputs
      .forEach((i) =>
        i.addListener('controlchange', (event) => {
          if (event.subtype === 'damperpedal') {
            const captured: PitchCapture[] = []
            i.addListener('noteon', (event) => {
              captured.push({ pitch: event.note.identifier, velocity: event.note.rawAttack })
            })
            const finishedListener = i.addOneTimeListener('controlchange', (event) => {
              if (event.controller.number === 64 && event.rawValue === 0) {
                console.log(captured)
              }
              i.removeListener('controlchange', finishedListener)
            })
          }
        }),
      )

    // Tone.Transport.timeSignature = [22, 8]
    this.transport.start()
    this.loop.start(0)
  }
}
