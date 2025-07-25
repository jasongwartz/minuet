import { describe, expect, test, vi } from 'vitest'

import { type EffectName, EffectWrapper } from './effect'

// Mock Tone.js
vi.mock('tone')

describe('EffectWrapper', () => {
  describe('Constructor and basic functionality', () => {
    test('should create effect instances for all supported effects', () => {
      const effectNames: EffectName[] = [
        'AutoFilter', 'AutoPanner', 'AutoWah', 'BitCrusher', 'Chebyshev',
        'Chorus', 'Distortion', 'FeedbackDelay', 'Filter', 'FrequencyShifter', 
        'Freeverb', 'JCReverb', 'PingPongDelay', 'PitchShift', 'Phaser',
        'Reverb', 'StereoWidener', 'Tremolo', 'Vibrato'
      ]

      effectNames.forEach(effectName => {
        const wrapper = new EffectWrapper(effectName)
        expect(wrapper.name).toBe(effectName)
        expect(wrapper.instance).toBeDefined()
        // Instance should have required methods
        expect(typeof wrapper.instance.connect).toBe('function')
        expect(typeof wrapper.instance.disconnect).toBe('function')
        expect(typeof wrapper.instance.set).toBe('function')
        expect(typeof wrapper.instance.get).toBe('function')
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
      const setMock = vi.spyOn(chorus.instance, 'set')

      chorus.setParam('frequency', 3)
      expect(setMock).toHaveBeenCalledWith({ frequency: 3 })

      chorus.setParam('depth', 0.9)
      expect(setMock).toHaveBeenCalledWith({ depth: 0.9 })
    })

    test('should work with different effect types', () => {
      const reverb = new EffectWrapper('Reverb')
      const setMock = vi.spyOn(reverb.instance, 'set')

      reverb.setParam('decay', 2.0)
      expect(setMock).toHaveBeenCalledWith({ decay: 2.0 })

      const distortion = new EffectWrapper('Distortion')
      const distortionSetMock = vi.spyOn(distortion.instance, 'set')

      distortion.setParam('distortion', 0.8)
      expect(distortionSetMock).toHaveBeenCalledWith({ distortion: 0.8 })
    })

    test('should handle effects with Record<string, unknown> options', () => {
      const feedbackDelay = new EffectWrapper('FeedbackDelay')
      const setMock = vi.spyOn(feedbackDelay.instance, 'set')

      feedbackDelay.setParam('delayTime', 0.25)
      expect(setMock).toHaveBeenCalledWith({ delayTime: 0.25 })

      const frequencyShifter = new EffectWrapper('FrequencyShifter')
      const freqSetMock = vi.spyOn(frequencyShifter.instance, 'set')

      frequencyShifter.setParam('frequency', 100)
      expect(freqSetMock).toHaveBeenCalledWith({ frequency: 100 })
    })
  })

  describe('getParam method', () => {
    test('should retrieve parameter values from instance', () => {
      const chorus = new EffectWrapper('Chorus')
      const mockReturnValue = {
        frequency: 1.5,
        depth: 0.7,
        wet: 1
      }
      // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      const getMock = vi.spyOn(chorus.instance, 'get').mockReturnValue(mockReturnValue as never)

      const frequency = chorus.getParam('frequency')
      expect(getMock).toHaveBeenCalled()
      expect(frequency).toBe(1.5)
    })
  })

  describe('Connection methods', () => {
    test('should connect effect to destination', () => {
      const chorus = new EffectWrapper('Chorus')
      const reverb = new EffectWrapper('Reverb')
      const connectMock = vi.spyOn(chorus.instance, 'connect')

      chorus.connect(reverb.instance)
      expect(connectMock).toHaveBeenCalledWith(reverb.instance)
    })

    test('should disconnect effect', () => {
      const chorus = new EffectWrapper('Chorus')
      const disconnectMock = vi.spyOn(chorus.instance, 'disconnect')

      chorus.disconnect()
      expect(disconnectMock).toHaveBeenCalled()
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
      const setMock = vi.spyOn(chorus.instance, 'set')

      // These should compile and work for Chorus
      chorus.setParam('frequency', 2)
      chorus.setParam('depth', 0.8)
      chorus.setParam('wet', 0.5)
      
      expect(setMock).toHaveBeenCalledTimes(3)
    })
  })

  describe('Effect chaining', () => {
    test('should support chaining multiple effects', () => {
      const distortion = new EffectWrapper('Distortion')
      const chorus = new EffectWrapper('Chorus')
      const reverb = new EffectWrapper('Reverb')

      const distortionConnectMock = vi.spyOn(distortion.instance, 'connect')
      const chorusConnectMock = vi.spyOn(chorus.instance, 'connect')

      // Chain: distortion -> chorus -> reverb
      distortion.connect(chorus.instance)
      chorus.connect(reverb.instance)

      expect(distortionConnectMock).toHaveBeenCalledWith(chorus.instance)
      expect(chorusConnectMock).toHaveBeenCalledWith(reverb.instance)
    })
  })

  describe('Real-time parameter updates', () => {
    test('should support rapid parameter changes (MIDI-style)', () => {
      const tremolo = new EffectWrapper('Tremolo')
      const setMock = vi.spyOn(tremolo.instance, 'set')

      // Simulate MIDI controller input changing frequency rapidly
      const frequencies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
      frequencies.forEach(freq => {
        tremolo.setParam('frequency', freq)
      })

      expect(setMock).toHaveBeenCalledTimes(frequencies.length)
      frequencies.forEach((freq, index) => {
        expect(setMock).toHaveBeenNthCalledWith(index + 1, { frequency: freq })
      })
    })

    test('should handle multiple parameter updates', () => {
      const phaser = new EffectWrapper('Phaser')
      const setMock = vi.spyOn(phaser.instance, 'set')

      // Update multiple parameters
      phaser.setParam('frequency', 1.2)
      phaser.setParam('octaves', 4)
      phaser.setParam('stages', 8)

      expect(setMock).toHaveBeenCalledTimes(3)
      expect(setMock).toHaveBeenNthCalledWith(1, { frequency: 1.2 })
      expect(setMock).toHaveBeenNthCalledWith(2, { octaves: 4 })
      expect(setMock).toHaveBeenNthCalledWith(3, { stages: 8 })
    })
  })

  describe('Edge cases', () => {
    test('should handle effects with complex parameter types', () => {
      const bitCrusher = new EffectWrapper('BitCrusher')
      const setMock = vi.spyOn(bitCrusher.instance, 'set')

      bitCrusher.setParam('bits', 6)
      expect(setMock).toHaveBeenCalledWith({ bits: 6 })
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
      const feedbackSetMock = vi.spyOn(feedbackDelay.instance, 'set')
      feedbackDelay.setParam('delayTime', 0.5)
      expect(feedbackSetMock).toHaveBeenCalledWith({ delayTime: 0.5 })
    })
  })
})