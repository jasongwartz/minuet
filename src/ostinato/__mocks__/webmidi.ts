import { vi } from 'vitest'

import { scheduledEvents } from '../test_utils'

const mockMidiOutput = {
  playNote: vi.fn((note: string, options: { duration: number }): void => {
    scheduledEvents.push({
      type: 'midi',
      time: 0,
      note,
      duration: options.duration,
      method: 'playNote',
      instrument: 'midi',
    })
  }),
}

export const WebMidi = {
  enable: vi.fn().mockResolvedValue({
    outputs: [mockMidiOutput],
    inputs: [],
  }),
}
