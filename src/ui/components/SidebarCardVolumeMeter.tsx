import { useCallback, useEffect, useRef, useState } from 'react'
import type { ToneAudioNode } from 'tone'
import * as Tone from 'tone'

import { Card, CardContent, CardHeader, CardTitle } from './shadcn-ui/card'
import { Progress } from './shadcn-ui/progress'

export function SidebarCardVolumeMeter({ node, title }: { title: string; node: ToneAudioNode }) {
  // Implementation largely sourced from:
  // https://css-tricks.com/using-requestanimationframe-with-react-hooks/
  // and
  // https://github.com/CollinsSpencer/react-web-audio
  const [volume, setVolume] = useState(0)
  const meter = useRef(new Tone.Meter())

  const requestRef = useRef<number>()

  const animate = useCallback(() => {
    const value = meter.current.getValue()
    setVolume(Array.isArray(value) ? (value[0] ?? 0) : value)
    const fps = 30
    setTimeout(() => {
      requestRef.current = requestAnimationFrame(animate)
    }, 1000 / fps)
  }, [meter])

  useEffect(() => {
    meter.current = new Tone.Meter()
    node.connect(meter.current)
    requestRef.current = requestAnimationFrame(animate)
    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [node, animate])

  return (
    <Card className='m-4'>
      <CardHeader className=''>
        <CardTitle className='truncate'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <Progress value={volume < -100 ? 0 : 100 + volume} />
      </CardContent>
    </Card>
  )
}
