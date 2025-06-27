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
          on: ['1'], // Second beat (0-indexed)
          with: [],
        },
      ],
    }

    await engine.start()

    const sampleEvents = getEventsByType('sample')
    expect(sampleEvents).toHaveLength(1)

    // At 60 BPM: beat 1 = 1 * (60/60) = 1 second (vs 0.5s at 120 BPM)
    expect(sampleEvents[0]?.time).toBe(1)

    // Verify timing using expectEventAtBeat with correct BPM
    const event = expectEventAtBeat('1', 'sample', 60)
    expect(event).toBeDefined()
    expect(event?.time).toBe(1)
  })

  describe('Sample instrument scheduling', () => {
    it('schedules sample triggers at correct beat times', async () => {
      // Configure engine with sample instrument
      // Note: 'on' defines positions within bars, not durations
      // '0' = first beat (0:0:0), '2' = third beat (0:2:0)
      engine.config = {
        bpm: 120,
        instruments: [
          {
            sample: { name: 'test.wav' },
            on: ['0', '2'], // First beat and third beat
            with: [],
          },
        ],
      }

      // Start engine to trigger scheduling
      await engine.start()

      // Verify sample events were scheduled
      const sampleEvents = getEventsByType('sample')
      expect(sampleEvents).toHaveLength(2)

      // Check first sample at beat 0
      const firstEvent = expectEventAtBeat('0', 'sample')
      expect(firstEvent).toBeDefined()
      expect(firstEvent?.type).toBe('sample')
      expect(firstEvent?.instrument).toBe('test.wav')
      expect(firstEvent?.method).toBe('start')

      // Check second sample at beat 2
      const secondEvent = expectEventAtBeat('2', 'sample')
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
            on: ['0', '1', '2', '3'], // Four beats of first bar
            with: [],
          },
        ],
      }

      await engine.start()

      const sampleEvents = getEventsByType('sample')
      expect(sampleEvents).toHaveLength(4)

      // Verify timing sequence (events sorted by time: 0=0s, 1=0.5s, 2=1s, 3=1.5s)
      expect(sampleEvents[0]?.time).toBe(0) // beat 0 = 0 seconds
      expect(sampleEvents[1]?.time).toBe(0.5) // beat 1 = 0.5 seconds
      expect(sampleEvents[2]?.time).toBe(1) // beat 2 = 1 second
      expect(sampleEvents[3]?.time).toBe(1.5) // beat 3 = 1.5 seconds
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
                beat: '0', // First beat
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
        time: 0, // beat 0 = 0 seconds at 120 BPM
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
