import { memo, useCallback, useEffect, useRef, useState } from 'react'
import type { ToneAudioNode } from 'tone'
import * as Tone from 'tone'

import { Card, CardContent, CardHeader, CardTitle } from './shadcn-ui/card'
import { Progress } from './shadcn-ui/progress'

export function SidebarVolumeCard({ node, title }: { title: string; node: ToneAudioNode }) {
  return (
    <Card className='m-4'>
      <CardHeader className=''>
        <CardTitle className='truncate'>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <SidebarCardVolumeMeter node={node} />
      </CardContent>
    </Card>
  )
}

export const SidebarCardVolumeMeter = memo(({ node }: { node: ToneAudioNode }) => {
  // Implementation largely sourced from:
  // https://css-tricks.com/using-requestanimationframe-with-react-hooks/
  // and
  // https://github.com/CollinsSpencer/react-web-audio
  const [volume, setVolume] = useState(0)
  const meter = useRef<Tone.Meter | null>(null)
  const requestRef = useRef<number>()
  const throttleTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const animate = useCallback(() => {
    const value = meter.current?.getValue() ?? 0
    setVolume(Array.isArray(value) ? (value[0] ?? 0) : value)
    const fps = 30
    throttleTimeout.current = setTimeout(() => {
      requestRef.current = requestAnimationFrame(animate)
    }, 1000 / fps)
  }, [])

  useEffect(() => {
    const meterNode = new Tone.Meter()
    meter.current = meterNode
    node.connect(meterNode)
    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current !== undefined) {
        cancelAnimationFrame(requestRef.current)
        requestRef.current = undefined
      }
      if (throttleTimeout.current) {
        clearTimeout(throttleTimeout.current)
        throttleTimeout.current = null
      }
      node.disconnect(meterNode)
      meterNode.dispose()
    }
  }, [node, animate])

  return <Progress value={volume < -100 ? 0 : 100 + volume} />
})
