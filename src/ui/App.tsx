import './App.css'

import type { OnMount } from '@monaco-editor/react'
import { Activity, Code, SquareChevronRight, Terminal } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type * as Tone from 'tone'

import { execFromEditor } from '../lang/evaluate'
import type { Track } from '../ostinato'
import { Engine } from '../ostinato'
import Editor, { type EditorLanguage } from './components/Editor'
import { LiveSidebar } from './components/LiveSidebar'
import { SamplesSidebar } from './components/SamplesSidebar'
import { Badge } from './components/shadcn-ui/badge'
import { HoverCard, HoverCardContent, HoverCardTrigger } from './components/shadcn-ui/hover-card'
import { cn } from './components/shadcn-ui/lib/utils'
import { Progress } from './components/shadcn-ui/progress'
import { SidebarProvider } from './components/shadcn-ui/sidebar'
import { Toaster } from './components/shadcn-ui/toaster'
import defaultPkl from './default_pkl.txt?raw'
import defaultTs from './default_ts.txt?raw'
import { getSamples, type SampleDetails } from './load_samples'
import { loadSample } from './load_samples'

interface StatusBadge {
  colour: string
  text: string | null
}

const App = () => {
  const [samples, setSamples] = useState([] as (SampleDetails & { player?: Tone.Player })[])
  const [engineState, setEngine] = useState<Engine | null>(null)
  const [progressBarValue, setProgressBarValue] = useState({
    phrase: 1,
    bar: 0,
    beat: 0,
    percentage: 0,
  })
  const [schedulingStatusIndicator, setSchedulingStatusIndicatorColour] = useState<StatusBadge>({
    colour: 'bg-gray-200',
    text: null,
  })
  const [evaluatingStatusIndicator, setEvaluatingStatusIndicatorColour] = useState<StatusBadge>({
    colour: 'bg-gray-200',
    text: null,
  })

  useEffect(() => {
    getSamples()
      .then(async (sampleList) => {
        setSamples(sampleList)
        await Promise.all(
          sampleList.map(async (sample, index) => {
            const loaded = await loadSample(sample)
            const amended = samples
            amended[index] = loaded
            setSamples(amended)
          }),
        )
      })
      .then(() => {
        setEngine(
          new Engine(
            Object.fromEntries(
              Object.entries(samples)
                .filter(
                  (entry): entry is [string, SampleDetails & { player: Tone.Player }] =>
                    !!entry[1].player,
                )
                .map((entry) => [entry[1].name, entry[1].player]),
            ),
            {
              onEachBeat: (phrase, bar, beat) => {
                const phraseLengthInBars = 4
                const beatsPerBar = 4
                setProgressBarValue({
                  phrase,
                  bar,
                  beat,
                  percentage:
                    (100 / (phraseLengthInBars * beatsPerBar)) *
                    ((bar % phraseLengthInBars) * beatsPerBar + beat + 1),
                })
              },
              onSchedulingStart: () => {
                setSchedulingStatusIndicatorColour({ text: '...', colour: 'bg-red-500' })
              },
              onSchedulingComplete: (duration) => {
                setTrackNodes(engineRef.current?.tracks ?? [])
                setTimeout(() => {
                  setSchedulingStatusIndicatorColour({
                    colour: 'bg-gray-200',
                    text: `${duration}ms`,
                  })
                }, 100)
              },
            },
          ),
        )
      })
      // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
      .catch(console.error)
  }, [])

  const samplesRef = useRef(samples)
  const engineRef = useRef(engineState)

  useEffect(() => {
    samplesRef.current = samples
  })
  useEffect(() => {
    engineRef.current = engineState
  })

  const onEditorMount: OnMount = (editor, monaco) => {
    monaco.editor.defineTheme('custom', {
      base: 'vs',
      inherit: true,
      rules: [],
      colors: {
        'editor.background': '#ffffff', //'#000000',
      },
    })
    monaco.editor.setTheme('custom')

    // editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter, () => {
    //   if (engineRef.current) {
    //     // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
    //     execFromEditor(engineRef.current, editor.getValue(), editorLanguage).catch(console.error)
    //   }
    // })
    editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Backslash, () => {
      if (engineRef.current) {
        const start = Date.now()
        setEvaluatingStatusIndicatorColour({ colour: 'bg-green-500', text: '...' })
        // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
        execFromEditor(engineRef.current, editor.getValue(), editorLanguage)
          .then(() => {
            setTimeout(() => {
              setEvaluatingStatusIndicatorColour({
                colour: 'bg-gray-200',
                text: `${Date.now() - start}ms`,
              })
            }, 100)
          })
          .catch((err: unknown) => {
            setEvaluatingStatusIndicatorColour({
              colour: 'bg-red-500',
              text: `${Date.now() - start}ms`,
            })
            console.error(err)
          })
      }
    })
  }

  const [trackNodes, setTrackNodes] = useState<Track[]>([])
  const [editorLanguage, setEditorLanguage] = useState<EditorLanguage>('typescript')

  return (
    <>
      <SidebarProvider>
        <SamplesSidebar
          samples={samples}
          onLanguageChange={(lang) => {
            setEditorLanguage(lang)
          }}
        />
        <div className='w-full min-w-0'>
          <div className='flex items-center'>
            <div className='m-4 space-x-4 max-w-fit'>
              <Badge variant={'outline'} className={cn('cursor-default px-4')}>
                Phrase {progressBarValue.phrase}
              </Badge>
              <Badge variant={'outline'} className={cn('cursor-default px-4')}>
                Bar {(progressBarValue.bar + 1) % 4 || 4}
              </Badge>
              <Badge variant={'outline'} className={cn('cursor-default px-4')}>
                Beat {progressBarValue.beat + 1}
              </Badge>
            </div>
            <div className='p-4 justify-center flex-grow'>
              <Progress value={progressBarValue.percentage} />
            </div>
            <div className='m-4 space-x-4'>
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
                    &nbsp;{schedulingStatusIndicator.text ?? '...'}
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
                    &nbsp;{evaluatingStatusIndicator.text ?? '...'}
                  </Badge>
                </HoverCardTrigger>
                <HoverCardContent className='w-80'>
                  <div className='flex justify-between space-x-4'>
                    <div className='space-y-1'>
                      <h4 className='text-sm font-semibold'>Language Evaluation</h4>
                      <p className='text-sm'>
                        This panel displays the duration of the most recent language evaluation
                        task.
                      </p>
                      {evaluatingStatusIndicator.text && (
                        <p className='text-sm'>
                          Most recent evaluation of the code in{' '}
                          <span className='font-semibold'>{editorLanguage}</span> took
                          duration:&nbsp;
                          <span className='font-semibold'>{evaluatingStatusIndicator.text}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </HoverCardContent>
              </HoverCard>
            </div>
          </div>

          <Editor
            defaultValue={editorLanguage === 'typescript' ? defaultTs : defaultPkl}
            editorLanguage={editorLanguage}
            onEditorMount={onEditorMount}
          />
        </div>
        <LiveSidebar tracks={trackNodes} phrase={progressBarValue.phrase} />
      </SidebarProvider>
      <Toaster />
    </>
  )
}

export default App
