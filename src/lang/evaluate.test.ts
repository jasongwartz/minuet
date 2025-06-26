import * as Tone from 'tone'
import { assert, describe, expect, it, vi } from 'vitest'

import { Engine } from '../ostinato'
import { execFromEditor } from './evaluate'

vi.mock('tone', () => ({
  start: vi.fn(),
  getContext: () => ({ lookAhead: 0 }),
  getTransport: () => ({
    bpm: { value: 120 },
    start: vi.fn(),
  }),
  Loop: class MockLoop {
    start() {
      /* pass */
    }
  },
  UserMedia: class MockUserMedia {
    open() {
      return Promise.resolve()
    }
  },
  Player: class MockPlayer {
    name: string
    autostart: boolean

    constructor() {
      this.name = 'test.wav'
      this.autostart = false
    }
  },
}))

vi.mock('webmidi', () => ({
  WebMidi: {
    enable: vi.fn().mockResolvedValue({ enable: vi.fn() }),
  },
}))

describe('execFromEditor', () => {
  it('can evaluate typescript expressions', async () => {
    const mockPlayer = new Tone.Player()
    const mockEngine = new Engine({ 'test.wav': mockPlayer })
    const spy = vi.spyOn(mockEngine, 'start')
    await execFromEditor(
      mockEngine,
      '({ instruments: [{ sample: { name: "test.wav" }, on: ["1n"] }] })',
      'typescript',
    )
    expect(spy).toHaveBeenCalledOnce()

    assert('config' in mockEngine && mockEngine.config && 'instruments' in mockEngine.config)
    expect(mockEngine.config.instruments).toStrictEqual([
      { sample: { name: 'test.wav' }, on: ['1n'], with: [] },
    ])
  })
  it('throws when evaluating invalid typescript', async () => {
    const mockEngine = new Engine({})
    const spy = vi.spyOn(mockEngine, 'start')

    await expect(
      execFromEditor(mockEngine, 'this is invalid ts syntax', 'typescript'),
    ).rejects.toThrowError(ReferenceError)
    expect(spy).not.toHaveBeenCalled()
  })
})
