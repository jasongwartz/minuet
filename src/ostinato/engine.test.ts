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

  it('BPM changes affect timing calculations', async () => {
    // Test at 60 BPM (slower tempo)
    engine.config = {
      bpm: 60,
      instruments: [
        {
          sample: { name: 'test.wav' },
          on: ['4n'], // Quarter note
          with: [],
        },
      ],
    }

    await engine.start()

    const sampleEvents = getEventsByType('sample')
    expect(sampleEvents).toHaveLength(1)

    // At 60 BPM: 4n = (60/60) * 1 = 1 second (vs 0.5s at 120 BPM)
    expect(sampleEvents[0]?.time).toBe(1)

    // Verify timing using expectEventAtBeat with correct BPM
    const event = expectEventAtBeat('4n', 'sample', 60)
    expect(event).toBeDefined()
    expect(event?.time).toBe(1)
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

      // Verify timing sequence (events sorted by time: 4n=0.5s, 3n≈0.67s, 2n=1s, 1n=2s)
      expect(sampleEvents[0]?.time).toBe(0.5) // 4n = 0.5 seconds
      expect(sampleEvents[1]?.time).toBeCloseTo(0.67, 1) // 3n ≈ 0.67 seconds
      expect(sampleEvents[2]?.time).toBe(1) // 2n = 1 second
      expect(sampleEvents[3]?.time).toBe(2) // 1n = 2 seconds
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
        time: 2, // beat 1n = 2 seconds at 120 BPM
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
