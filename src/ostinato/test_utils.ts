// Types for captured events
export interface ScheduledEvent {
  type: 'sample' | 'synth' | 'midi' | 'beat'
  time: number
  note?: string
  duration?: number | string
  instrument?: string
  method: string
}

// Mock event collectors
export const scheduledEvents: ScheduledEvent[] = []

// Test utilities
export function clearScheduledEvents(): void {
  scheduledEvents.length = 0
}

export function getEventsByType(type: ScheduledEvent['type']): ScheduledEvent[] {
  return scheduledEvents.filter((event) => event.type === type)
}

export function expectEventAtBeat(
  beat: string,
  type: ScheduledEvent['type'],
  bpm = 120,
): ScheduledEvent | undefined {
  const expectedTime = (() => {
    const secondsPerBeat = 60 / bpm

    // Handle note durations (e.g., "1n", "2n", "4n")
    const noteRegex = /^(\d+)n$/i
    const noteMatch = noteRegex.exec(beat)
    if (noteMatch?.[1]) {
      const noteValue = parseInt(noteMatch[1], 10)
      if (noteValue === 1) {
        // Whole note = 4 beats in 4/4 time
        return secondsPerBeat * 4
      } else {
        // Other notes: 4/noteValue beats
        return secondsPerBeat * (4 / noteValue)
      }
    }

    // Handle measures (e.g., "4m")
    const measureRegex = /^(\d+)m$/i
    const measureMatch = measureRegex.exec(beat)
    if (measureMatch?.[1]) {
      const measures = parseInt(measureMatch[1], 10)
      // 4 beats per measure in 4/4 time
      return secondsPerBeat * 4 * measures
    }

    // Fallback to parsing as seconds
    return parseFloat(beat) || 0
  })()

  // Find event by both time and type
  const event = scheduledEvents.find(
    (event) => Math.abs(event.time - expectedTime) <= 0.001 && event.type === type,
  )

  return event
}
