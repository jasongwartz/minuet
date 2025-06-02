import { useRef, useState } from 'react'
import type { WebMidi } from 'webmidi'

import { Card, CardContent, CardHeader, CardTitle } from './shadcn-ui/card'

export function MidiDebugCard({ webmidi }: { webmidi: typeof WebMidi }) {
  const [mostRecentChange, setMostRecentChange] = useState<{
    input: {
      name: string
      number: number
    }
    controller: {
      name: string
      number: number
    }
    value?: number
    type?: string
  } | null>(null)

  const clearValueMessageTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  webmidi.inputs.forEach((input, index) => {
    input.addListener('controlchange', (event) => {
      if (clearValueMessageTimeout.current) {
        clearTimeout(clearValueMessageTimeout.current)
      }
      setMostRecentChange({
        input: {
          name: input.name,
          number: index,
        },
        controller: { name: event.controller.name, number: event.controller.number },
        value: event.rawValue,
        type: event.type,
      })
      clearValueMessageTimeout.current = setTimeout(() => {
        setMostRecentChange(null)
      }, 500)
    })
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>MIDI Debug</CardTitle>
      </CardHeader>
      <CardContent>
        <div>
          <p className='font-semibold'>Input {mostRecentChange?.input.number}</p>
          <p className='text-xs font-thin'>{mostRecentChange?.input.name}</p>
          <p>
            Controller <span className='font-bold'>{mostRecentChange?.controller.number}</span>
          </p>
          <p>
            Type: <span className='font-extrabold'>{mostRecentChange?.type}</span>
          </p>
          <p>
            Value: <span className='font-extrabold'>{mostRecentChange?.value}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
