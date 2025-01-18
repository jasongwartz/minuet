import * as Tone from 'tone'
import type { TransportClass } from 'tone/build/esm/core/clock/Transport'

import type { Instrument, OstinatoSchema } from './schema'

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

export class Engine {
  samples: Record<string, Tone.Player>
  tracks: Track[]
  config?: OstinatoSchema
  loop: Tone.Loop
  transport: TransportClass
  events?: Events
  phrase = 0

  get started() {
    return this.transport.state === 'started'
  }

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

        for (const playCue of instrument.on.sort((a, b) => {
          const aBeat = typeof a === 'string' ? a : a.beat
          const bBeat = typeof b === 'string' ? b : b.beat
          return Tone.Time(aBeat).toSeconds() - Tone.Time(bBeat).toSeconds()
        })) {
          if (typeof playCue === 'string') {
            synth.triggerAttackRelease('C4', '8n', time + Tone.Time(playCue).toSeconds())
          } else {
            if (playCue.mode === 'once') {
              for (const [index, note] of playCue.notes.entries()) {
                synth.triggerAttackRelease(
                  note,
                  playCue.duration,
                  time +
                    Tone.Time(playCue.beat).toSeconds() +
                    index * Tone.Time(playCue.duration).toSeconds(),
                )
              }
            } else {
              let timePointer = time
              let lastNote: string | null = null

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

              console.log(notesWithOctaveVariance)

              while (timePointer < time + Tone.Time('4m').toSeconds()) {
                const availableNotes =
                  lastNote !== null
                    ? notesWithOctaveVariance.filter((note) => note !== lastNote)
                    : notesWithOctaveVariance

                const randomIndex = Math.floor(Math.random() * availableNotes.length)
                // eslint-disable-next-line @typescript-eslint/non-nullable-type-assertion-style
                lastNote = availableNotes[randomIndex] as string

                synth.triggerAttackRelease(lastNote, playCue.duration, timePointer)
                timePointer += Tone.Time(playCue.every).toSeconds()
              }
            }
          }
        }
      } else {
        if (!(instrument.sample.name in this.samples)) {
          throw new Error(
            `Sample name "${instrument.sample.name}" unknown! Sample names available: ${Object.keys(this.samples).join(', ')}`,
          )
        }
        const sample = this.samples[instrument.sample.name] ?? null

        const effects = instrument.with.map((effect) => {
          switch (effect.name) {
            case 'flanger':
              return new Tone.Distortion(0.4)
            case 'lpf':
              return new Tone.Filter('C6', 'lowpass')
          }
        })

        // Whatever the previous chain was, disconnect it to avoid duplicate outputs
        // and to allow removing of effects from samples that previously had them.
        sample?.disconnect()

        sample?.chain(...effects, Tone.getDestination())
        const player = sample?.toDestination()
        newTracks.push({ config: instrument, node: sample ?? undefined })

        /*
        // HOW TO IMPLEMENT stretching sample to a whole bar
        console.log(player.toSeconds('4n'), player.buffer.duration, player.sampleTime / player.toSeconds('1:0:0'))
        player.playbackRate = player.buffer.duration / player.toSeconds('1:0:0')
        */
        if (player && instrument.sample.stretchTo) {
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
          player?.start(time + Tone.Time(note).toSeconds())
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
    this.events = events
  }

  async start() {
    await Tone.start()
    // Tone.Transport.timeSignature = [22, 8]
    this.transport.start()
    this.loop.start(0)
  }
}
