import { useEffect, useRef, useState } from 'react'
import type { ToneAudioNode } from 'tone'
import * as Tone from 'tone'

import { Card, CardContent, CardHeader, CardTitle } from './shadcn-ui/card'
import { Progress } from './shadcn-ui/progress'

export function SidebarCardVolumeMeter({ node, title }: { title: string; node: ToneAudioNode }) {
  // Implementation largely sourced from:
  // https://css-tricks.com/using-requestanimationframe-with-react-hooks/
  const [volume, setVolume] = useState(0)
  const meter = new Tone.Meter()
  node.connect(meter)

  const requestRef = useRef<number>()
  const previousTimeRef = useRef<number>()

  const animate = (time: number) => {
    if (previousTimeRef.current !== undefined) {
      const value = meter.getValue()

      setVolume(() => (Array.isArray(value) ? (value[0] ?? 0) : value))
    }
    previousTimeRef.current = time
    requestRef.current = requestAnimationFrame(animate)
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={volume < -100 ? 0 : 100 + volume} />
      </CardContent>
    </Card>
  )
}
