import dedent from 'dedent'
import * as Tone from 'tone'
import { assert, describe, expect, it, vi } from 'vitest'
import { YAMLParseError } from 'yaml'
import { ZodError } from 'zod/v4'

import { Engine } from '../ostinato'
import { execFromEditor } from './evaluate'
import { PLUGINS } from './plugins'

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
            on: [0]
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
              - 0
      `,
    ],
    [
      'lua',
      dedent`
        -- Create configuration as Lua table
        return {
          bpm = 120,
          instruments = {
            {
              sample = { name = "test.wav" },
              on = { 0 }
            }
          }
        }
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
        { sample: { name: 'test.wav' }, on: [0], with: [] },
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

  describe('syntax errors', () => {
    it.each([
      {
        language: 'typescript',
        syntax: '({ unclosed: ',
        errorType: SyntaxError,
        description: 'unclosed object',
      },
      {
        language: 'typescript',
        syntax: 'invalid javascript syntax',
        errorType: ReferenceError,
        description: 'invalid reference',
      },
      {
        language: 'yaml',
        syntax: '{ "unclosed": ',
        errorType: YAMLParseError,
        description: 'unclosed JSON in YAML',
      },
      {
        language: 'yaml',
        syntax: 'bpm: 120\n  invalid_indentation: true',
        errorType: YAMLParseError,
        description: 'invalid indentation',
      },
      {
        language: 'lua',
        syntax: 'return "unclosed string',
        errorType: Error,
        description: 'unclosed string',
      },
    ] as const)(
      'throws $errorType for $description in $language',
      async ({ language, syntax, errorType }) => {
        const mockEngine = new Engine({})
        const spy = vi.spyOn(mockEngine, 'start')

        await expect(execFromEditor(mockEngine, syntax, language)).rejects.toThrow(errorType)
        expect(spy).not.toHaveBeenCalled()
      },
    )
  })
})

describe('Language plugin implementations', () => {
  describe('Lua', () => {
    const luaPlugin = PLUGINS.lua

    it.each([
      {
        description: 'returns number values directly',
        input: 'return 123',
        expected: 123,
      },
      {
        description: 'returns string values directly',
        input: 'return "hello world"',
        expected: 'hello world',
      },
      {
        description: 'returns boolean values directly',
        input: 'return true',
        expected: true,
      },
      {
        description: 'converts Lua tables to JavaScript objects',
        input: 'return { message = "Hello", count = 42, active = true }',
        expected: { message: 'Hello', count: 42, active: true },
      },
      {
        description: 'converts nested Lua tables to nested JavaScript objects',
        input: `
          return {
            bpm = 120,
            instruments = {
              {
                sample = { name = "test.wav" },
                on = { 0 }
              }
            }
          }
        `,
        expected: {
          bpm: 120,
          instruments: [
            {
              sample: { name: 'test.wav' },
              on: [0],
            },
          ],
        },
      },
    ] as const)('$description', async ({ input, expected }) => {
      const result = await luaPlugin.render(input)
      expect(result).toEqual(expected)
    })

    it.each([
      {
        description: 'throws when nothing is returned',
        input: 'local x = 1',
        expectedError: 'Lua code must return a value!',
      },
      {
        description: 'throws when nil is returned',
        input: 'return nil',
        expectedError: 'Lua code must return a value!',
      },
      {
        description: 'throws on syntax errors',
        input: 'return "unclosed string',
        expectedError: Error,
      },
    ] as const)('$description', async ({ input, expectedError }) => {
      await expect(luaPlugin.render(input)).rejects.toThrow(expectedError)
    })
  })
})
