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
  return scheduledEvents.filter(event => event.type === type)
}

export function expectEventAtBeat(beat: string, type: ScheduledEvent['type']): ScheduledEvent | undefined {
  const expectedTime = (() => {
    // Simple time conversion for testing
    if (beat === '1n') return 0
    if (beat === '2n') return 2
    if (beat === '3n') return 4
    if (beat === '4n') return 6
    if (beat === '4m') return 16 // 4 measures
    return parseFloat(beat) || 0
  })()
  
  // Find event by both time and type
  const event = scheduledEvents.find(event => 
    Math.abs(event.time - expectedTime) <= 0.001 && event.type === type
  )
  
  return event
}