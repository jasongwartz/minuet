import { vi } from 'vitest'

import { scheduledEvents } from '../test_utils'

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

export const start = vi.fn()
const mockContext = {
  lookAhead: 0.5,
}

export const getContext = () => mockContext
export const getTransport = () => mockTransport
export const getDestination = (): object => ({})
export const getDraw = () => mockGetDraw
export const Time = mockTime

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

// Generic mock effect class for minimal mocking
class MockEffect {
  connect = vi.fn()
  disconnect = vi.fn()
  set = vi.fn()
  get = vi.fn(() => ({}))
  dispose = vi.fn()
}

// Export all effect classes using the generic mock
export const AutoFilter = MockEffect
export const AutoPanner = MockEffect
export const AutoWah = MockEffect
export const BitCrusher = MockEffect
export const Chebyshev = MockEffect
export const Chorus = MockEffect
export const Distortion = MockEffect
export const FeedbackDelay = MockEffect
export const FrequencyShifter = MockEffect
export const Freeverb = MockEffect
export const JCReverb = MockEffect
export const PingPongDelay = MockEffect
export const PitchShift = MockEffect
export const Phaser = MockEffect
export const Reverb = MockEffect
export const StereoWidener = MockEffect
export const Tremolo = MockEffect
export const Vibrato = MockEffect
