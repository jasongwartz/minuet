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

const timeOrderSort = (
  a: string | number | { beat: string },
  b: string | number | { beat: string },
) => {
  // Sort beats into order:
  // Tone cannot schedule an event in advance of an already-scheduled event for the same track.
  const aBeat = typeof a === 'string' || typeof a === 'number' ? a : a.beat
  const bBeat = typeof b === 'string' || typeof b === 'number' ? b : b.beat
  return Tone.Time(aBeat).toSeconds() - Tone.Time(bBeat).toSeconds()
}

export class Engine {
  samples: Record<string, Tone.Player>
  tracks: Track[]
  config?: OstinatoSchema
  loop: Tone.Loop
  transport: TransportClass
  webMidi: typeof WM
  events?: Events
  phrase = 0
  userMedia: Tone.UserMedia
  userMediaStreams: { default: Tone.UserMedia } & Record<string, Tone.UserMedia>

  get started() {
    return this.transport.state === 'started'
  }

  // TODO: pre-collect all the playback, and only schedule if no errors
  // during planning (otherwise keep playing what was previously scheduled).
  // That, or schedule everything except the instruments that had errors?
  callback: Tone.LoopOptions['callback'] = (globalClockPhraseStartTime: number) => {
    // The `time` value passed to the Tone.Loop callback is the
    // global clock value at the time the callback is scheduling
    // things for, ie. the time the callback happens plus the lookahead.
    //
    // Events on the Transport need to be scheduled using the
    // transport's "local" elapsed time - otherwise they will occur
    // delayed, where the delay is the time between the page load
    // and the transport starting.
    const transportClockPhraseStartTime = this.transport.getSecondsAtTime(
      globalClockPhraseStartTime,
    )

    const start = Date.now()
    this.phrase += 1
    this.events?.onSchedulingStart?.()

    this.transport.scheduleRepeat(
      (repeatTime) => {
        // Calculate how many seconds, and therefore how many beats,
        // will have passed from the phrase start time
        // until this callback is scheduled to occur.
        const elapsedTimeSinceStartOfPhrase =
          this.transport.getSecondsAtTime(repeatTime) - transportClockPhraseStartTime
        const currentBeat = Tone.Time(elapsedTimeSinceStartOfPhrase)
          .toBarsBeatsSixteenths()
          .split(':')
        Tone.getDraw().schedule(() => {
          this.events?.onEachBeat?.(
            this.phrase,
            parseFloat(currentBeat[0] ?? '0'),
            parseFloat(currentBeat[1] ?? '0'),
          )
        }, repeatTime)
      },
      '4n',
      transportClockPhraseStartTime,
    )

    if (this.config?.bpm) {
      this.transport.bpm.value = this.config.bpm
    }

    const newTracks = []

    for (const instrument of this.config?.instruments ?? []) {
      let audioNodeStartOfChain: Tone.ToneAudioNode

      if ('synth' in instrument) {
        let schedulePlay: (
          note: string,
          duration: string | number, // Either a number in milliseconds, or a Tone Time-string
          globalClockScheduleTime: Tone.Unit.Seconds,
        ) => void

        if (typeof instrument.synth === 'string') {
          const synth = instrument.synth === 'FMSynth' ? new Tone.FMSynth() : new Tone.AMSynth()
          audioNodeStartOfChain = synth
          schedulePlay = (note, durationMs, globalClockScheduleTime) => {
            synth.triggerAttackRelease(note, durationMs, globalClockScheduleTime)
          }
        } else {
          // This a MIDI external synth, not a WebAudio one
          const synthConfig = instrument.synth
          let midiOutputNumber: number
          if (this.webMidi.outputs.length === 1) {
            midiOutputNumber = 0
          } else if (synthConfig.output) {
            midiOutputNumber = synthConfig.output
          } else {
            throw new Error('from.input is required when more than 1 MIDI device is connected')
          }

          if (synthConfig.loopback) {
            const { input, channel } = synthConfig.loopback
            let inputStream: Tone.UserMedia
            if (input) {
              const stream = this.userMediaStreams[input]
              if (stream) {
                inputStream = stream
                inputStream.disconnect()
              } else {
                inputStream = this.userMedia // TODO: this should be a future stream somehow, not the default input
                this.userMedia
                  .open(input)
                  .then((stream) => {
                    this.userMediaStreams[input] = stream
                  })
                  .catch(console.error)
              }
            } else {
              inputStream = this.userMediaStreams.default
              inputStream.disconnect()
            }
            if (channel) {
              const split = new Tone.Split()
              inputStream.connect(split)
              const passthrough = new Tone.Gain()
              split.connect(passthrough, channel === 'left' ? 0 : 1)
              audioNodeStartOfChain = passthrough
            } else {
              audioNodeStartOfChain = inputStream
            }
          } else {
            // In this case there is no audio node representing
            // this playing synth, so we initialise an empty source.
            // That way, all the effects code later doesn't need to
            // account for audioNodeStartOfChain possibly being undefined.
            audioNodeStartOfChain = new Tone.ToneBufferSource()
          }

          schedulePlay = (note, duration, globalClockScheduleTime) => {
            Tone.getDraw().schedule(() => {
              this.webMidi.outputs[midiOutputNumber]?.playNote(note, {
                duration:
                  typeof duration === 'string' ? Tone.Time(duration).toMilliseconds() : duration,
              })
            }, globalClockScheduleTime)
          }
        }

        for (const playCue of instrument.on.sort(timeOrderSort)) {
          if (playCue.mode === 'once') {
            for (const [index, note] of playCue.notes.entries()) {
              schedulePlay(
                note,
                playCue.duration,
                globalClockPhraseStartTime +
                  Tone.Time(playCue.beat).toSeconds() +
                  index * Tone.Time(playCue.duration).toSeconds(),
              )
            }
          } else {
            // This function takes a note-string like "C4" and alters the octave
            // number postfix, so eg `incrementNoteString("C4", 1) returns "C5".
            const incrementNoteString = (input: string, by: number) => {
              return input.replace(/(\D+)(\d+)$/, (_, letters: string, number: string) => {
                const incrementedNumber = parseInt(number, 10) + by
                return letters + incrementedNumber.toString()
              })
            }

            const notesWithOctaveVariance = playCue.notes
              .map((note) => {
                const pitches = [note]
                for (let i = 1; i < (playCue.octaveVariance ?? 0) + 1; i++) {
                  pitches.push(incrementNoteString(note, i))
                  pitches.push(incrementNoteString(note, -i))
                }
                return pitches.filter((pitch) => Tone.isNote(pitch))
              })
              .flat()

            let timePointer = globalClockPhraseStartTime
            let lastNote: string | null = null

            while (timePointer < globalClockPhraseStartTime + Tone.Time('4m').toSeconds()) {
              const availableNotes =
                lastNote !== null
                  ? // We don't want to repeat a note, so if the note was already played last,
                    // remove it from the list of nodes under consideration for random choice.
                    notesWithOctaveVariance.filter((note) => note !== lastNote)
                  : notesWithOctaveVariance

              const randomIndex = Math.floor(Math.random() * availableNotes.length)
              // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
              lastNote = availableNotes[randomIndex] as string

              schedulePlay(lastNote, playCue.duration, timePointer)
              timePointer += Tone.Time(playCue.every).toSeconds()
            }
          }
        }
      } else if ('external' in instrument) {
        const { input } = instrument.external
        if (input) {
          if (input in this.userMediaStreams) {
            audioNodeStartOfChain = this.userMediaStreams[input]! // !!!!
            // TODO: Use Splitter to get an individual channel
          } else {
            audioNodeStartOfChain = this.userMedia // TODO: this should be a future stream somehow, not the default input
            this.userMedia
              .open(input)
              .then((stream) => {
                this.userMediaStreams[input] = stream
              })
              .catch(console.error)
          }
        } else {
          audioNodeStartOfChain = this.userMediaStreams.default /// !!!
        }
        // TODO: Splitter for left or right
      } else {
        const sample = this.samples[instrument.sample.name]
        if (sample === undefined) {
          throw new Error(
            `Sample name "${instrument.sample.name}" unknown! Sample names available: ${Object.keys(this.samples).join(', ')}`,
          )
        }
        audioNodeStartOfChain = sample

        if (instrument.sample.stretchTo) {
          sample.playbackRate =
            sample.buffer.duration / sample.toSeconds(instrument.sample.stretchTo)
        }

        for (const note of instrument.on.sort(timeOrderSort)) {
          sample.start(globalClockPhraseStartTime + Tone.Time(note).toSeconds())
        }
      }

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
      audioNodeStartOfChain.disconnect()
      audioNodeStartOfChain.chain(...effects.map((e) => e.node), Tone.getDestination())
      newTracks.push({ config: instrument, node: audioNodeStartOfChain })
    }

    this.tracks = newTracks
    this.events?.onSchedulingComplete?.(Date.now() - start)
  }

  constructor(samples: Record<string, Tone.Player>, events?: Events) {
    this.tracks = []
    this.samples = samples
    this.loop = new Tone.Loop(this.callback, '4m')
    Tone.getContext().lookAhead = 0.5 // Increase lookahead time (default is 0.1)
    this.transport = Tone.getTransport()
    this.transport.bpm.value = 60
    this.webMidi = WM
    this.events = events
    this.userMedia = new Tone.UserMedia()
    this.userMediaStreams = {
      // will be open()'d in `async start()` below,
      // where it can be awaited
      default: this.userMedia,
    }
  }

  async start() {
    await Tone.start()
    this.webMidi = await this.webMidi.enable()
    // Tone.Transport.timeSignature = [22, 8]
    await this.userMediaStreams.default.open()
    this.transport.start()
    this.loop.start(0)
  }
}

// TODO: Firefox switches output to the chosen device when calling
// `new Tone.UserMedia()`, which is annoying if you don't want to use
// the input device also as output.
// This wasn't quite enough to make it work:
//
// if (
//   'selectAudioOutput' in navigator.mediaDevices &&
//   typeof navigator.mediaDevices.selectAudioOutput === 'function'
// ) {
//   await navigator.mediaDevices.selectAudioOutput()
// } else {
//   console.log('selectAudioOutput() not supported.')
// }
