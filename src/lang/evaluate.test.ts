import dedent from 'dedent'
import * as Tone from 'tone'
import { assert, describe, expect, it, vi } from 'vitest'
import { ZodError } from 'zod/v4'

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
  it('throws when evaluating invalid typescript', async () => {
    const mockEngine = new Engine({})
    const spy = vi.spyOn(mockEngine, 'start')

    await expect(
      execFromEditor(mockEngine, 'this is invalid ts syntax', 'typescript'),
    ).rejects.toThrowError(ReferenceError)
    expect(spy).not.toHaveBeenCalled()
  })

  describe.each([
    [
      'typescript',
      dedent`
        ({
          bpm: 120,
          instruments: [{
            sample: { name: "test.wav" },
            on: ["1n"]
          }]
        })
      `,
    ],
    [
      'yaml',
      dedent`
        bpm: 120
        instruments:
          - sample:
              name: test.wav
            on:
              - "1n"
      `,
    ],
  ] as const)('language support: %s', (language, validInput) => {
    it('should parse valid input and set engine config', async () => {
      const mockPlayer = new Tone.Player()
      const mockEngine = new Engine({ 'test.wav': mockPlayer })
      const spy = vi.spyOn(mockEngine, 'start')

      await execFromEditor(mockEngine, validInput, language)

      expect(spy).toHaveBeenCalledOnce()
      assert('config' in mockEngine && mockEngine.config)
      expect(mockEngine.config.bpm).toBe(120)
      expect(mockEngine.config.instruments).toStrictEqual([
        { sample: { name: 'test.wav' }, on: ['1n'], with: [] },
      ])
    })
  })

  describe('Schema validation', () => {
    it.each([
      ['missing instruments field', '({ bpm: 120 })'],
      ['invalid instrument type', '({ instruments: ["not-an-object"] })'],
      ['invalid bpm type', '({ bpm: "not-a-number", instruments: [] })'],
      [
        'invalid effect name',
        '({ instruments: [{ synth: "FMSynth", on: [], with: [{ name: "badeffect", value: 1 }] }] })',
      ],
      ['invalid sample instrument', '({ instruments: [{ sample: { name: "test.wav" } }] })'], // missing 'on' field
      ['invalid synth instrument', '({ instruments: [{ synth: "FMSynth" }] })'], // missing 'on' field
    ] as const)('throws ZodError for %s', async (_testName, invalidInput) => {
      const mockEngine = new Engine({})
      const spy = vi.spyOn(mockEngine, 'start')

      await expect(execFromEditor(mockEngine, invalidInput, 'typescript')).rejects.toThrow(ZodError)
      expect(spy).not.toHaveBeenCalled()
    })
  })
})
