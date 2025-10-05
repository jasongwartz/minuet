// Types for captured events
export interface ScheduledEvent {
  type: 'sample' | 'synth' | 'midi' | 'beat' | 'param'
  time: number
  note?: string
  duration?: number | string
  instrument?: string
  method: string
  value?: number
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

    // Handle bars:beats:sixteenths format (e.g., "0:2:1", "1:0:0")
    const positionRegex = /^(\d+):(\d+):(\d+)$/
    const positionMatch = positionRegex.exec(beat)
    if (positionMatch?.[1] && positionMatch[2] && positionMatch[3]) {
      const bars = parseInt(positionMatch[1], 10)
      const beats = parseInt(positionMatch[2], 10)
      const sixteenths = parseInt(positionMatch[3], 10)

      // Calculate total time in seconds
      const beatsPerBar = 4
      const sixteenthsPerBeat = 4

      const totalBeats = bars * beatsPerBar + beats + sixteenths / sixteenthsPerBeat
      return totalBeats * secondsPerBeat
    }

    // Handle shorthand formats (e.g., "0" = "0:0:0", "2" = "0:2:0")
    const beatNumber = parseInt(beat, 10)
    if (!isNaN(beatNumber)) {
      // Simple beat number within first bar
      return beatNumber * secondsPerBeat
    }

    // Handle note durations (e.g., "4n") - keeping for backward compatibility
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

    // Handle measures (e.g., "4m") - keeping for backward compatibility
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
