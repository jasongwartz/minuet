import { vi } from 'vitest'

import { scheduledEvents } from '../test_utils'

const mockTime = (timeString: string) => ({
  toSeconds: (): number => {
    if (timeString === '1n') return 0
    if (timeString === '2n') return 2
    if (timeString === '3n') return 4
    if (timeString === '4n') return 6
    if (timeString === '4m') return 16
    return parseFloat(timeString) || 0
  },
  toBarsBeatsSixteenths: (): string => '0:0:0'
})

const mockTransport = {
  scheduleRepeat: vi.fn((callback: (time: number) => void, interval: string, startTime: number, duration: string): void => {
    scheduledEvents.push({
      type: 'beat',
      time: startTime,
      method: 'scheduleRepeat',
      instrument: `interval:${interval}`,
      duration
    })
    callback(startTime)
  }),
  getSecondsAtTime: vi.fn((time: number): number => time),
  bpm: { value: 120 },
  state: 'stopped',
  start: vi.fn()
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
  })
}

const mockSample = {
  start: vi.fn((time: number): void => {
    scheduledEvents.push({
      type: 'sample',
      time,
      method: 'start',
      instrument: 'test.wav'
    })
  }),
  buffer: { duration: 2.0 },
  toSeconds: vi.fn().mockReturnValue(1.0),
  disconnect: vi.fn(),
  chain: vi.fn()
}

const mockSynth = {
  triggerAttackRelease: vi.fn((note: string, duration: string | number, time: number): void => {
    scheduledEvents.push({
      type: 'synth',
      time,
      note,
      duration,
      method: 'triggerAttackRelease',
      instrument: 'FMSynth'
    })
  }),
  disconnect: vi.fn(),
  chain: vi.fn()
}

export const start = vi.fn()
const mockContext = {
  lookAhead: 0.5
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