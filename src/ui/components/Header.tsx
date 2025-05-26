import { useAtom } from 'jotai'

import { currentBeatAtom } from '../state'
import HeaderStatusIndicators from './HeaderStatusIndicators'
import { Badge } from './shadcn-ui/badge'
import { cn } from './shadcn-ui/lib/utils'
import { Progress } from './shadcn-ui/progress'

const phraseLengthInBars = 4
const beatsPerBar = 4

export default function Header() {
  const [currentBeat] = useAtom(currentBeatAtom)

  const progressBarPercentage =
    currentBeat === null
      ? 0
      : (100 / (phraseLengthInBars * beatsPerBar)) *
        ((currentBeat.bar % phraseLengthInBars) * beatsPerBar + currentBeat.beat + 1)

  return (
    <div className='flex items-center'>
      <div className='m-4 space-x-4 max-w-fit'>
        <Badge variant={'outline'} className={cn('cursor-default px-4')}>
          Phrase {currentBeat?.phrase ?? '1'}
        </Badge>
        <Badge variant={'outline'} className={cn('cursor-default px-4')}>
          Bar {((currentBeat?.bar ?? 0) + 1) % 4 || 4}
        </Badge>
        <Badge variant={'outline'} className={cn('cursor-default px-4')}>
          Beat {(currentBeat?.beat ?? 0) + 1}
        </Badge>
      </div>
      <div className='p-4 justify-center flex-grow'>
        <Progress value={progressBarPercentage} />
      </div>
      <div className='m-4 space-x-4'>
        <HeaderStatusIndicators />
      </div>
    </div>
  )
}
