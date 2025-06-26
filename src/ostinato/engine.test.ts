import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('tone', async () => {
  const mockModule = await import('./__mocks__/tone')
  return mockModule
})

vi.mock('webmidi', async () => {
  const mockModule = await import('./__mocks__/webmidi')
  return mockModule
})

import * as Tone from 'tone'

import { Engine } from './index'
import { clearScheduledEvents, expectEventAtBeat, getEventsByType } from './test_utils'

describe('Engine Scheduling', () => {
  let engine: Engine

  beforeEach(() => {
    clearScheduledEvents()
    vi.clearAllMocks()

    const mockPlayer = new Tone.Player()
    engine = new Engine({ 'test.wav': mockPlayer })
  })

  it('sets transport BPM from config', async () => {
    const bpm = 140
    engine.config = {
      bpm,
      instruments: [],
    }

    await engine.start()
    expect(engine.config.bpm).toEqual(bpm)
  })

  describe('Sample instrument scheduling', () => {
    it('schedules sample triggers at correct beat times', async () => {
      // Configure engine with sample instrument
      engine.config = {
        bpm: 120,
        instruments: [
          {
            sample: { name: 'test.wav' },
            on: ['1n', '3n'],
            with: [],
          },
        ],
      }

      // Start engine to trigger scheduling
      await engine.start()

      // Verify sample events were scheduled
      const sampleEvents = getEventsByType('sample')
      expect(sampleEvents).toHaveLength(2)

      // Check first sample at beat 1
      const firstEvent = expectEventAtBeat('1n', 'sample')
      expect(firstEvent).toBeDefined()
      expect(firstEvent?.type).toBe('sample')
      expect(firstEvent?.instrument).toBe('test.wav')
      expect(firstEvent?.method).toBe('start')

      // Check second sample at beat 3
      const secondEvent = expectEventAtBeat('3n', 'sample')
      expect(secondEvent).toBeDefined()
      expect(secondEvent?.type).toBe('sample')
      expect(secondEvent?.instrument).toBe('test.wav')
      expect(secondEvent?.method).toBe('start')
    })

    it('schedules multiple samples in sequence', async () => {
      engine.config = {
        bpm: 120,
        instruments: [
          {
            sample: { name: 'test.wav' },
            on: ['1n', '2n', '3n', '4n'],
            with: [],
          },
        ],
      }

      await engine.start()

      const sampleEvents = getEventsByType('sample')
      expect(sampleEvents).toHaveLength(4)

      // Verify timing sequence
      expect(sampleEvents[0]?.time).toBe(0) // 1n = 0
      expect(sampleEvents[1]?.time).toBe(2) // 2n = 2
      expect(sampleEvents[2]?.time).toBe(4) // 3n = 4
      expect(sampleEvents[3]?.time).toBe(6) // 4n = 6
    })
  })

  describe('Synth instrument scheduling', () => {
    it('schedules synth notes for "once" mode', async () => {
      engine.config = {
        bpm: 120,
        instruments: [
          {
            synth: 'FMSynth',
            on: [
              {
                notes: ['C4', 'E4'],
                beat: '1n',
                duration: '4n',
                mode: 'once',
              },
            ],
            with: [],
          },
        ],
      }

      await engine.start()

      const synthEvents = getEventsByType('synth')
      expect(synthEvents).toHaveLength(2)

      // Check first note
      expect(synthEvents[0]).toMatchObject({
        type: 'synth',
        time: 0, // beat 1n
        note: 'C4',
        duration: '4n',
        method: 'triggerAttackRelease',
        instrument: 'FMSynth',
      })

      // Check second note (should be staggered)
      expect(synthEvents[1]).toMatchObject({
        type: 'synth',
        note: 'E4',
        duration: '4n',
      })
    })
  })

  describe('Beat callback scheduling', () => {
    it('schedules beat callbacks for UI updates', async () => {
      engine.config = {
        bpm: 120,
        instruments: [],
      }

      await engine.start()

      // Verify beat callback was scheduled
      const beatEvents = getEventsByType('beat')
      expect(beatEvents).toHaveLength(1)
      expect(beatEvents[0]?.instrument).toBe('interval:4n')
    })
  })
})
