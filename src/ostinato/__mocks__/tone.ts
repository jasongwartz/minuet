import { vi } from 'vitest'

import { scheduledEvents } from '../test_utils'

const pitchClassOffsets: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

const toFrequency = (value: number | string): number => {
  if (typeof value === 'number') {
    return value
  }

  const numericValue = Number(value)
  if (!Number.isNaN(numericValue)) {
    return numericValue
  }

  const trimmed = value.trim()
  const noteMatch = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(trimmed)
  if (noteMatch) {
    const note = noteMatch[1]?.toUpperCase()
    const accidental = noteMatch[2]
    const octave = parseInt(noteMatch[3] ?? '0', 10)

    const baseOffset = pitchClassOffsets[note ?? '']
    if (baseOffset === undefined) {
      return 0
    }

    let semitoneOffset = baseOffset
    if (accidental === '#') {
      semitoneOffset += 1
    } else if (accidental === 'b') {
      semitoneOffset -= 1
    }

    const midiNumber = (octave + 1) * 12 + semitoneOffset
    return 440 * 2 ** ((midiNumber - 69) / 12)
  }

  return 0
}

const mockTime = (timeString: string | number) => ({
  toSeconds: (): number => {
    const currentBPM = mockTransport.bpm.value
    const secondsPerBeat = 60 / currentBPM

    // If it's already a number (seconds), return it directly
    if (typeof timeString === 'number') {
      return timeString
    }

    // Handle bars:beats:sixteenths format (e.g., "0:2:1", "1:0:0")
    const positionRegex = /^(\d+):(\d+):(\d+)$/
    const positionMatch = positionRegex.exec(timeString)
    if (positionMatch?.[1] && positionMatch[2] && positionMatch[3]) {
      const bars = parseInt(positionMatch[1], 10)
      const beats = parseInt(positionMatch[2], 10)
      const sixteenths = parseInt(positionMatch[3], 10)

      // Calculate total time in seconds
      const beatsPerBar = 4
      const sixteenthsPerBeat = 4

      const totalBeats = bars * beatsPerBar + beats + sixteenths / sixteenthsPerBeat
      return totalBeats * secondsPerBeat
    }

    // Handle shorthand formats (e.g., "0" = "0:0:0", "2" = "0:2:0")
    const beatNumber = parseInt(timeString, 10)
    if (!isNaN(beatNumber)) {
      // Simple beat number within first bar
      return beatNumber * secondsPerBeat
    }

    // Handle note durations (e.g., "4n") - keeping for backward compatibility
    const noteRegex = /^(\d+)n$/i
    const noteMatch = noteRegex.exec(timeString)
    if (noteMatch?.[1]) {
      const noteValue = parseInt(noteMatch[1], 10)
      if (noteValue === 1) {
        // Whole note = 4 beats in 4/4 time
        return secondsPerBeat * 4
      } else {
        // Other notes: 4/noteValue beats
        return secondsPerBeat * (4 / noteValue)
      }
    }

    // Handle measures (e.g., "4m") - keeping for backward compatibility
    const measureRegex = /^(\d+)m$/i
    const measureMatch = measureRegex.exec(timeString)
    if (measureMatch?.[1]) {
      const measures = parseInt(measureMatch[1], 10)
      // 4 beats per measure in 4/4 time
      return secondsPerBeat * 4 * measures
    }

    // Fallback to parsing as seconds
    return parseFloat(timeString) || 0
  },
  toBarsBeatsSixteenths: (): string => {
    // If already in bars:beats:sixteenths format, return as-is
    const formatRegex = /^\d+:\d+:\d+$/
    if (typeof timeString === 'string' && formatRegex.exec(timeString)) {
      return timeString
    }

    // Convert the time to seconds first, then to bars:beats:sixteenths
    const timeInSeconds = mockTime(timeString).toSeconds()
    const currentBPM = mockTransport.bpm.value
    const secondsPerBeat = 60 / currentBPM

    // Convert seconds to bars:beats:sixteenths (assuming 4/4 time)
    const beatsPerBar = 4
    const sixteenthsPerBeat = 4

    const totalBeats = timeInSeconds / secondsPerBeat
    const bars = Math.floor(totalBeats / beatsPerBar)
    const beats = Math.floor(totalBeats % beatsPerBar)
    const remainingBeats = totalBeats - (bars * beatsPerBar + beats)
    const sixteenths = Math.floor(remainingBeats * sixteenthsPerBeat)

    return `${bars}:${beats}:${sixteenths}`
  },
})

const mockTransport = {
  scheduleRepeat: vi.fn(
    (
      callback: (time: number) => void,
      interval: string,
      startTime: number,
      duration: string,
    ): void => {
      scheduledEvents.push({
        type: 'beat',
        time: startTime,
        method: 'scheduleRepeat',
        instrument: `interval:${interval}`,
        duration,
      })
      callback(startTime)
    },
  ),
  getSecondsAtTime: vi.fn((time: number): number => time),
  bpm: { value: 120 },
  state: 'stopped',
  start: vi.fn(),
}

const mockGetDraw = {
  schedule: vi.fn((callback: () => void, time: number): void => {
    const originalLength = scheduledEvents.length
    callback()
    if (scheduledEvents.length > originalLength) {
      const lastEvent = scheduledEvents[scheduledEvents.length - 1]
      if (lastEvent) {
        lastEvent.time = time
      }
    }
  }),
}

const mockSample = {
  start: vi.fn((time: number): void => {
    scheduledEvents.push({
      type: 'sample',
      time,
      method: 'start',
      instrument: 'test.wav',
    })
  }),
  buffer: { duration: 2.0 },
  toSeconds: vi.fn().mockReturnValue(1.0),
  disconnect: vi.fn(),
  chain: vi.fn(),
}

const mockSynth = {
  triggerAttackRelease: vi.fn((note: string, duration: string | number, time: number): void => {
    scheduledEvents.push({
      type: 'synth',
      time,
      note,
      duration,
      method: 'triggerAttackRelease',
      instrument: 'FMSynth',
    })
  }),
  disconnect: vi.fn(),
  chain: vi.fn(),
}

class MockParam {
  instrument: string
  value: number
  connect = vi.fn()
  cancelScheduledValues = vi.fn((time: number): void => {
    scheduledEvents.push({
      type: 'param',
      time,
      method: 'cancelScheduledValues',
      instrument: this.instrument,
      value: this.value,
    })
  })
  setValueAtTime = vi.fn((value: number, time: number): void => {
    this.value = value
    scheduledEvents.push({
      type: 'param',
      time,
      method: 'setValueAtTime',
      instrument: this.instrument,
      value,
    })
  })
  linearRampToValueAtTime = vi.fn((value: number, time: number): void => {
    this.value = value
    scheduledEvents.push({
      type: 'param',
      time,
      method: 'linearRampToValueAtTime',
      instrument: this.instrument,
      value,
    })
  })

  constructor(instrument: string, initialValue = 0) {
    this.instrument = instrument
    this.value = initialValue
  }
}

export const start = vi.fn()
const mockContext = {
  lookAhead: 0.5,
}

export const getContext = () => mockContext
export const getTransport = () => mockTransport
export const getDestination = (): object => ({})
export const getDraw = () => mockGetDraw
export const Time = mockTime
export const Frequency = (value: number | string) => ({
  toFrequency: (): number => toFrequency(value),
})

export class Loop {
  private callback: (time: number) => void

  constructor(callback: (time: number) => void, _interval: string) {
    this.callback = callback
  }

  start(): void {
    this.callback(0)
  }

  stop(): void {
    return undefined
  }
}

export class Player {
  name = 'test.wav'
  autostart = false
  start = mockSample.start
  buffer = mockSample.buffer
  toSeconds = mockSample.toSeconds
  disconnect = mockSample.disconnect
  chain = mockSample.chain
}

export class FMSynth {
  triggerAttackRelease = mockSynth.triggerAttackRelease
  disconnect = mockSynth.disconnect
  chain = mockSynth.chain
}

export class Filter {
  type: string
  frequency: MockParam
  disconnect = vi.fn()
  chain = vi.fn()
  connect = vi.fn()

  constructor(_frequency?: number, type = 'lowpass') {
    this.type = type
    this.frequency = new MockParam(`${type}.frequency`)
  }
}

export class Distortion {
  distortion = 0
  disconnect = vi.fn()
  chain = vi.fn()
  connect = vi.fn()
}

export class Gain {
  gain = new MockParam('gain')
  disconnect = vi.fn()
  chain = vi.fn()
  connect = vi.fn()
}

export class Volume {
  volume = new MockParam('volume')
  disconnect = vi.fn()
  chain = vi.fn()
  connect = vi.fn()
}

export class LFO {
  connect = vi.fn()
  start = vi.fn()

  constructor(
    public period: string | number,
    public min: number,
    public max: number,
  ) {}
}

export class UserMedia {
  open(): Promise<this> {
    return Promise.resolve(this)
  }

  disconnect(): void {
    return undefined
  }

  close(): void {
    return undefined
  }
}
