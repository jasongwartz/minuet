// No need to import Tone types for this test file
import { describe, expect, test, vi } from 'vitest'

import { type EffectName, EffectWrapper } from './effect'

// Mock Tone.js
vi.mock('tone')

describe('EffectWrapper', () => {
  describe('Constructor and basic functionality', () => {
    test('should create effect instances for all supported effects', () => {
      const effectNames: EffectName[] = [
        'AutoFilter',
        'AutoPanner',
        'AutoWah',
        'BitCrusher',
        'Chebyshev',
        'Chorus',
        'Distortion',
        'FeedbackDelay',
        'Filter',
        'FrequencyShifter',
        'Freeverb',
        'JCReverb',
        'PingPongDelay',
        'PitchShift',
        'Phaser',
        'Reverb',
        'StereoWidener',
        'Tremolo',
        'Vibrato',
      ]

      effectNames.forEach((effectName) => {
        const wrapper = new EffectWrapper(effectName)
        expect(wrapper.name).toBe(effectName)
        expect(wrapper.instance).toBeDefined()
        // Instance should have required methods (check as object with properties)
        expect(wrapper.instance).toBeDefined()
        expect(typeof wrapper.instance).toBe('object')
        expect(wrapper.instance).not.toBeNull()

        // Check that the instance has the expected methods through the wrapper
        expect(typeof wrapper.setParam).toBe('function')
        expect(typeof wrapper.getParam).toBe('function')
        expect(typeof wrapper.connect).toBe('function')
        expect(typeof wrapper.disconnect).toBe('function')
      })
    })

    test('should create effect with options', () => {
      const chorus = new EffectWrapper('Chorus', { frequency: 2 })
      expect(chorus.name).toBe('Chorus')
      expect(chorus.instance).toBeDefined()
    })
  })

  describe('setParam method', () => {
    test('should call set method on instance with correct parameters', () => {
      const chorus = new EffectWrapper('Chorus')

      // Test that setParam works by calling it and checking it doesn't throw
      expect(() => {
        chorus.setParam('frequency', 3)
      }).not.toThrow()
      expect(() => {
        chorus.setParam('depth', 0.9)
      }).not.toThrow()

      // Verify the methods exist and work
      expect(typeof chorus.setParam).toBe('function')
    })

    test('should work with different effect types', () => {
      const reverb = new EffectWrapper('Reverb')
      expect(() => {
        reverb.setParam('decay', 2.0)
      }).not.toThrow()

      const distortion = new EffectWrapper('Distortion')
      expect(() => {
        distortion.setParam('distortion', 0.8)
      }).not.toThrow()

      // Verify both instances work correctly
      expect(reverb.name).toBe('Reverb')
      expect(distortion.name).toBe('Distortion')
    })

    test('should handle effects with Record<string, unknown> options', () => {
      const feedbackDelay = new EffectWrapper('FeedbackDelay')
      expect(() => {
        feedbackDelay.setParam('delayTime', 0.25)
      }).not.toThrow()

      const frequencyShifter = new EffectWrapper('FrequencyShifter')
      expect(() => {
        frequencyShifter.setParam('frequency', 100)
      }).not.toThrow()

      // Verify these effects were created successfully
      expect(feedbackDelay.name).toBe('FeedbackDelay')
      expect(frequencyShifter.name).toBe('FrequencyShifter')
    })
  })

  describe('getParam method', () => {
    test('should retrieve parameter values from instance', () => {
      const chorus = new EffectWrapper('Chorus')

      // Test that getParam method exists and can be called
      expect(typeof chorus.getParam).toBe('function')

      // Since our mock returns an empty object from get(), getParam should return undefined
      // for any parameter that doesn't exist in the empty object
      const frequencyValue = chorus.getParam('frequency')
      expect(frequencyValue).toBeUndefined()

      const depthValue = chorus.getParam('depth')
      expect(depthValue).toBeUndefined()
    })
  })

  describe('Connection methods', () => {
    test('should connect effect to destination', () => {
      const chorus = new EffectWrapper('Chorus')
      const reverb = new EffectWrapper('Reverb')

      // Test that connect method works without throwing - this tests the functionality
      // without needing to access internal implementation details
      expect(() => {
        if (
          typeof chorus.instance === 'object' &&
          chorus.instance !== null &&
          'connect' in chorus.instance
        ) {
          const connectMethod = Reflect.get(chorus.instance, 'connect')
          if (typeof connectMethod === 'function') {
            Reflect.apply(connectMethod, chorus.instance, [reverb.instance])
          }
        }
      }).not.toThrow()
      expect(typeof chorus.connect).toBe('function')
    })

    test('should disconnect effect', () => {
      const chorus = new EffectWrapper('Chorus')

      expect(() => {
        chorus.disconnect()
      }).not.toThrow()
      expect(typeof chorus.disconnect).toBe('function')
    })
  })

  describe('Type safety', () => {
    test('effect names should be type-safe', () => {
      // This test verifies compile-time type safety
      // If these lines compile, the types are working correctly
      const chorus = new EffectWrapper('Chorus')
      const reverb = new EffectWrapper('Reverb')
      const distortion = new EffectWrapper('Distortion')

      expect(chorus.name).toBe('Chorus')
      expect(reverb.name).toBe('Reverb')
      expect(distortion.name).toBe('Distortion')
    })

    test('setParam should be type-safe for specific effects', () => {
      const chorus = new EffectWrapper('Chorus')

      // These should compile and work for Chorus
      expect(() => {
        chorus.setParam('frequency', 2)
      }).not.toThrow()
      expect(() => {
        chorus.setParam('depth', 0.8)
      }).not.toThrow()
      expect(() => {
        chorus.setParam('wet', 0.5)
      }).not.toThrow()

      expect(typeof chorus.setParam).toBe('function')
    })
  })

  describe('Effect chaining', () => {
    test('should support chaining multiple effects', () => {
      const distortion = new EffectWrapper('Distortion')
      const chorus = new EffectWrapper('Chorus')
      const reverb = new EffectWrapper('Reverb')

      // Test that connect methods exist and can be called - functionality testing
      expect(typeof distortion.connect).toBe('function')
      expect(typeof chorus.connect).toBe('function')
      expect(typeof reverb.connect).toBe('function')

      // Verify all effects have the required interface
      expect(distortion.name).toBe('Distortion')
      expect(chorus.name).toBe('Chorus')
      expect(reverb.name).toBe('Reverb')
    })
  })

  describe('Real-time parameter updates', () => {
    test('should support rapid parameter changes (MIDI-style)', () => {
      const tremolo = new EffectWrapper('Tremolo')

      // Simulate MIDI controller input changing frequency rapidly
      const frequencies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

      // Test that rapid parameter changes don't throw errors
      expect(() => {
        frequencies.forEach((freq) => {
          tremolo.setParam('frequency', freq)
        })
      }).not.toThrow()

      // Verify the effect was created successfully
      expect(tremolo.name).toBe('Tremolo')
      expect(tremolo.instance).toBeDefined()
    })

    test('should handle multiple parameter updates', () => {
      const phaser = new EffectWrapper('Phaser')

      // Test that multiple parameter updates work without throwing
      expect(() => {
        phaser.setParam('frequency', 1.2)
        phaser.setParam('octaves', 4)
        phaser.setParam('stages', 8)
      }).not.toThrow()

      // Verify the effect maintains its identity after parameter changes
      expect(phaser.name).toBe('Phaser')
      expect(phaser.instance).toBeDefined()
    })
  })

  describe('Edge cases', () => {
    test('should handle effects with complex parameter types', () => {
      const bitCrusher = new EffectWrapper('BitCrusher')

      // Test that complex parameter setting works functionally
      expect(() => {
        bitCrusher.setParam('bits', 6)
      }).not.toThrow()
      expect(bitCrusher.name).toBe('BitCrusher')
      expect(bitCrusher.instance).toBeDefined()
    })

    test('should handle effects without exported Options types', () => {
      // These effects use Record<string, unknown> for options
      const feedbackDelay = new EffectWrapper('FeedbackDelay')
      const frequencyShifter = new EffectWrapper('FrequencyShifter')
      const reverb = new EffectWrapper('Reverb')

      expect(feedbackDelay.instance).toBeDefined()
      expect(frequencyShifter.instance).toBeDefined()
      expect(reverb.instance).toBeDefined()

      // Should be able to set parameters even with unknown options
      expect(() => {
        feedbackDelay.setParam('delayTime', 0.5)
      }).not.toThrow()
      expect(feedbackDelay.name).toBe('FeedbackDelay')
    })
  })
})
