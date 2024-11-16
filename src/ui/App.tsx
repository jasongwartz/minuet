import './App.css'

import type { OnMount } from '@monaco-editor/react'
import { useEffect, useRef, useState } from 'react'
import type * as Tone from 'tone'

import { execFromEditor } from '../lang/evaluate'
import { Engine } from '../ostinato'
import Editor, { type EditorLanguage } from './components/Editor'
import { Progress } from './components/shadcn-ui/progress'
/* eslint-disable import/no-unresolved */
import defaultPkl from './default_pkl.txt?raw'
import defaultTs from './default_ts.txt?raw'
/* eslint-enable import/no-unresolved */
import { getSamples, type SampleDetails } from './load_samples'
import { loadSample } from './load_samples'
import { SidebarProvider } from './components/shadcn-ui/sidebar'
import { SamplesSidebar } from './components/SamplesSidebar'
import { LiveSidebar } from './components/LiveSidebar'

const App = () => {
  const [samples, setSamples] = useState([] as (SampleDetails & { player?: Tone.Player })[])
  const [engineState, setEngine] = useState<Engine | null>(null)
  const [progressBarValue, setProgressBarValue] = useState(0)

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
                    !!entry[1]?.player,
                )
                .map((entry) => [entry[0], entry[1].player]),
            ),
            (bar, beat) => {
              const phraseLengthInBars = 4
              const beatsPerBar = 4
              setProgressBarValue(
                (100 / (phraseLengthInBars * beatsPerBar)) *
                  ((bar % phraseLengthInBars) * beatsPerBar + beat + 1),
              )
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

    editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter, () => {
      if (engineRef.current) {
        // eslint-disable-next-line @typescript-eslint/use-unknown-in-catch-callback-variable
        execFromEditor(engineRef.current, editor.getValue(), editorLanguage).catch(console.error)
      }
    })
  }

  const [editorLanguage, setEditorLanguage] = useState<EditorLanguage>('typescript')

  return (
    <>
      <SidebarProvider>
        <SamplesSidebar samples={samples} onLanguageChange={(lang) => setEditorLanguage(lang)} />
        <div className='w-screen'>
          <div className='p-4 flex justify-center'>
            <Progress value={progressBarValue} className='w-[90%]' />
          </div>

          <Editor
            defaultValue={editorLanguage === 'typescript' ? defaultTs : defaultPkl}
            editorLanguage={editorLanguage}
            onEditorMount={onEditorMount}
          />
        </div>
        <LiveSidebar />
      </SidebarProvider>
    </>
  )
}

export default App
