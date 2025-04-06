import { useAtom } from 'jotai'
import { Activity, Terminal } from 'lucide-react'

import {
  editorLanguageAtom,
  evaluatingStatusIndicatorAtom,
  schedulingStatusIndicatorAtom,
} from '../state'
import { Badge } from './shadcn-ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './shadcn-ui/hover-card'
import { cn } from './shadcn-ui/lib/utils'

export default function HeaderStatusIndicators() {
  const [evaluatingStatusIndicator] = useAtom(evaluatingStatusIndicatorAtom)
  const [schedulingStatusIndicator] = useAtom(schedulingStatusIndicatorAtom)
  const [editorLanguage] = useAtom(editorLanguageAtom)

  return (
    <>
      <HoverCard openDelay={100} closeDelay={100}>
        <HoverCardTrigger>
          <Badge
            variant={'outline'}
            className={cn(
              'cursor-help transition-colors min-w-8',
              schedulingStatusIndicator.colour,
            )}
          >
            <Activity className='size-4' />
            &nbsp;{schedulingStatusIndicator.text}
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent className='w-80'>
          <div className='flex justify-between space-x-4'>
            <div className='space-y-1'>
              <h4 className='text-sm font-semibold'>Audio Scheduling</h4>
              <p className='text-sm'>
                This panel displays the duration of the most recent audio scheduling task.
              </p>
              {schedulingStatusIndicator.text && (
                <p className='text-sm'>
                  Most recent audio scheduling took duration:&nbsp;
                  <span className='font-semibold'>{schedulingStatusIndicator.text}</span>
                </p>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>

      <HoverCard openDelay={100} closeDelay={100}>
        {/* TODO: also open/close on click */}
        <HoverCardTrigger>
          <Badge
            variant={'outline'}
            className={cn(
              'cursor-help transition-colors min-w-8',
              evaluatingStatusIndicator.colour,
            )}
          >
            <Terminal className='size-4' />
            &nbsp;{evaluatingStatusIndicator.text}
          </Badge>
        </HoverCardTrigger>
        <HoverCardContent className='w-80'>
          <div className='flex justify-between space-x-4'>
            <div className='space-y-1'>
              <h4 className='text-sm font-semibold'>Language Evaluation</h4>
              <p className='text-sm'>
                This panel displays the duration of the most recent language evaluation task.
              </p>
              {evaluatingStatusIndicator.text && (
                <p className='text-sm'>
                  Most recent evaluation of the code in{' '}
                  <span className='font-semibold'>{editorLanguage}</span> took duration:&nbsp;
                  <span className='font-semibold'>{evaluatingStatusIndicator.text}</span>
                </p>
              )}
            </div>
          </div>
        </HoverCardContent>
      </HoverCard>
    </>
  )
}
