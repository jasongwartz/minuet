import { describe, it, expect, beforeEach, vi } from 'vitest'
import { execFromEditor, PLUGINS } from './evaluate'
import type { Engine } from '../ostinato'

// Mock the engine
const mockEngine: Engine = {
  samples: { kick: 'sample1', snare: 'sample2' },
  config: null,
  started: false,
  start: vi.fn().mockResolvedValue(undefined),
} as any

describe('evaluate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('execFromEditor', () => {
    it('should successfully validate and execute valid YAML configuration', async () => {
      const validYaml = `
instruments:
  - sample:
      name: kick
    on: ["1"]
  - synth: FMSynth
    on:
      - notes: ["C4"]
        beat: "1"
        duration: "4n"
        mode: once
      `

      await expect(execFromEditor(mockEngine, validYaml, 'yaml')).resolves.not.toThrow()
      expect(mockEngine.start).toHaveBeenCalled()
    })

    it('should throw validation error for sample instrument missing required "on" field', async () => {
      const invalidYaml = `
instruments:
  - sample:
      name: kick
      `

      await expect(execFromEditor(mockEngine, invalidYaml, 'yaml')).rejects.toThrow()
    })

    it('should throw validation error for sample instrument missing required "sample" field', async () => {
      const invalidYaml = `
instruments:
  - on: ["1"]
      `

      await expect(execFromEditor(mockEngine, invalidYaml, 'yaml')).rejects.toThrow()
    })

    it('should throw validation error for sample instrument missing required "sample.name" field', async () => {
      const invalidYaml = `
instruments:
  - sample: {}
    on: ["1"]
      `

      await expect(execFromEditor(mockEngine, invalidYaml, 'yaml')).rejects.toThrow()
    })

    it('should throw validation error for sample instrument with invalid "on" field type', async () => {
      const invalidYaml = `
instruments:
  - sample:
      name: kick
    on: "not-an-array"
      `

      await expect(execFromEditor(mockEngine, invalidYaml, 'yaml')).rejects.toThrow()
    })

    it('should handle empty samples in engine gracefully', async () => {
      const engineWithEmptySamples = {
        ...mockEngine,
        samples: {},
      }

      const validYaml = `
instruments:
  - sample:
      name: kick
    on: ["1"]
      `

      await expect(execFromEditor(engineWithEmptySamples, validYaml, 'yaml')).resolves.not.toThrow()
      expect(mockEngine.start).not.toHaveBeenCalled()
    })

    it('should validate and execute TypeScript configuration', async () => {
      const validTypeScript = `
export default {
  instruments: [
    {
      sample: { name: "kick" },
      on: ["1"]
    }
  ]
}
      `

      await expect(execFromEditor(mockEngine, validTypeScript, 'typescript')).resolves.not.toThrow()
    })

    it('should validate synth instruments with required fields', async () => {
      const validSynthYaml = `
instruments:
  - synth: FMSynth
    on:
      - notes: ["C4"]
        beat: "1"
        duration: "4n"
        mode: once
      `

      await expect(execFromEditor(mockEngine, validSynthYaml, 'yaml')).resolves.not.toThrow()
    })

    it('should throw validation error for synth instrument missing required "on" field', async () => {
      const invalidSynthYaml = `
instruments:
  - synth: FMSynth
      `

      await expect(execFromEditor(mockEngine, invalidSynthYaml, 'yaml')).rejects.toThrow()
    })

    it('should throw validation error for invalid synth type', async () => {
      const invalidSynthYaml = `
instruments:
  - synth: InvalidSynth
    on:
      - notes: ["C4"]
        beat: "1"
        duration: "4n"
        mode: once
      `

      await expect(execFromEditor(mockEngine, invalidSynthYaml, 'yaml')).rejects.toThrow()
    })
  })

  describe('PLUGINS', () => {
    it('should have all expected plugins available', () => {
      expect(PLUGINS).toHaveProperty('yaml')
      expect(PLUGINS).toHaveProperty('typescript')
      expect(PLUGINS).toHaveProperty('python')
      expect(PLUGINS).toHaveProperty('pkl')
    })

    it('should have correct plugin names', () => {
      expect(PLUGINS.yaml.name).toBe('YAML')
      expect(PLUGINS.typescript.name).toBe('TypeScript')
      expect(PLUGINS.python.name).toBe('Python')
      expect(PLUGINS.pkl.name).toBe('Pkl')
    })
  })
})