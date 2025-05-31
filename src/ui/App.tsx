import './App.css'

import type { OnMount } from '@monaco-editor/react'
import { useAtom, useSetAtom } from 'jotai'
import { useEffect, useRef, useState } from 'react'
import type * as Tone from 'tone'

import { execFromEditor, PLUGINS } from '../lang/evaluate'
import type { Track } from '../ostinato'
import { Engine } from '../ostinato'
import type { EditorLanguage } from './components/Editor'
import Editor from './components/Editor'
import Header from './components/Header'
import { LiveSidebar } from './components/LiveSidebar'
import { SamplesSidebar } from './components/SamplesSidebar'
import { useToast } from './components/shadcn-ui/hooks/use-toast'
import { SidebarProvider } from './components/shadcn-ui/sidebar'
import { Toaster } from './components/shadcn-ui/toaster'
import defaultPkl from './default_pkl.txt?raw'
import defaultPython from './default_python.txt?raw'
import defaultTs from './default_ts.txt?raw'
import { getSamples, type SampleDetails } from './load_samples'
import { loadSample } from './load_samples'
import {
  currentBeatAtom,
  editorLanguageAtom,
  evaluatingStatusIndicatorAtom,
  schedulingStatusIndicatorAtom,
} from './state'

const App = () => {
  const [engineState, setEngine] = useState<Engine | null>(null)
  const [samples, setSamples] = useState<(SampleDetails & { player?: Tone.Player })[]>([])

  const { toast } = useToast()
  const setCurrentBeat = useSetAtom(currentBeatAtom)
  const setEvaluatingStatusIndicator = useSetAtom(evaluatingStatusIndicatorAtom)
  const setSchedulingStatusIndicator = useSetAtom(schedulingStatusIndicatorAtom)
  const [editorLanguage, setEditorLanguage] = useAtom(editorLanguageAtom)
  const editorLanguageRef = useRef(editorLanguage)

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
                setCurrentBeat({ phrase, bar, beat })
              },
              onSchedulingStart: () => {
                setSchedulingStatusIndicator({ text: '...', colour: 'bg-red-500' })
              },
              onSchedulingComplete: (duration) => {
                setTrackNodes(engineRef.current?.tracks ?? [])
                setTimeout(() => {
                  setSchedulingStatusIndicator({
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
  useEffect(() => {
    editorLanguageRef.current = editorLanguage
  })

  const onEditorMount: OnMount = (editor, monaco) => {
    monaco.editor.setTheme('vs-light')

    const evaluateEditorCallback = () => {
      if (!engineRef.current) {
        toast({
          description: `Engine not yet started: loaded ${samplesRef.current.filter((s) => 'player' in s).length} out of ${samplesRef.current.length} samples`,
          variant: 'destructive',
        })
        return
      }
      const start = Date.now()
      setEvaluatingStatusIndicator({ colour: 'bg-green-500', text: '...' })
      // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
      execFromEditor(engineRef.current, editor.getValue(), editorLanguageRef.current)
        .then(async () => {
          await editor.getAction('editor.action.formatDocument')?.run()
          setTimeout(() => {
            setEvaluatingStatusIndicator({
              colour: 'bg-gray-200',
              text: `${Date.now() - start}ms`,
            })
          }, 100)
        })
        .catch((err: unknown) => {
          setEvaluatingStatusIndicator({
            colour: 'bg-red-500',
            text: `${Date.now() - start}ms`,
          })
          console.error(err)
          toast({
            title: `Error evaluating code${err instanceof Error ? `: ${err.name}` : ''}`,
            description: err instanceof Error ? err.message : 'Unknown error',
            variant: 'destructive',
          })
        })
    }
    editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter, evaluateEditorCallback)
    editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Backslash, evaluateEditorCallback)
  }

  const [trackNodes, setTrackNodes] = useState<Track[]>([])

  const defaultContentsByLanguage: Partial<Record<EditorLanguage, string>> = {
    typescript: defaultTs,
    python: defaultPython,
    pkl: defaultPkl,
  }

  return (
    <>
      <SidebarProvider>
        <SamplesSidebar
          samples={samples}
          onLanguageChange={(lang) => {
            setEditorLanguage(lang)
            if (PLUGINS[lang].register) {
              console.log(`Registering plugin "${PLUGINS[lang].name}"`)
              PLUGINS[lang]
                .register()
                .then(() => {
                  console.log(`Loaded and registered language plugin "${lang}"`)
                })
                .catch(console.error)
            }
          }}
        />
        <div className='w-full min-w-0'>
          <Header />

          <Editor
            defaultValue={defaultContentsByLanguage[editorLanguage] ?? ''}
            editorLanguage={editorLanguage}
            onEditorMount={onEditorMount}
          />
        </div>
        <LiveSidebar tracks={trackNodes} webmidi={engineRef.current?.webMidi} />
      </SidebarProvider>
      <Toaster />
    </>
  )
}

export default App
