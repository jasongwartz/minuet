import './App.css'

import type { OnMount } from '@monaco-editor/react'
import { useEffect, useRef, useState } from 'react'
import type * as Tone from 'tone'

import { execFromEditor } from '../lang/evaluate'
import { Engine } from '../ostinato'
import defaultPkl from './default_pkl.txt?raw'
import defaultTs from './default_ts.txt?raw'
import Editor, { type EditorLanguage } from './Editor'
import { getSamples, type SampleDetails } from './load_samples'
import { loadSample } from './load_samples'

const App = () => {
  const [isLoading, setIsLoading] = useState(false)

  const [samples, setSamples] = useState(
    {} as Record<string, SampleDetails & { player: Tone.Player }>,
  )
  const [engineState, setEngine] = useState<Engine | null>(null)

  useEffect(() => {
    console.log('loading samples')
    getSamples()
      .then((s) => Promise.all(s.map(loadSample)))
      .then((players) => {
        setSamples(Object.fromEntries(players.map((p) => [p.name, p])))
        setIsLoading(false)
        setEngine(new Engine(Object.fromEntries(players.map((p) => [p.name, p.player]))))
      })
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
        execFromEditor(engineRef.current, editor.getValue(), editorLanguage).catch(console.error)
      }
    })
  }

  const [editorLanguage, setEditorLanguage] = useState<EditorLanguage>('pkl')

  return (
    <div>
      <div>
        {Object.entries(samples).map((sample) => (
          <button
            onClick={() => {
              sample[1].player.state === 'stopped'
                ? sample[1].player.toDestination().start(0)
                : sample[1].player.stop()
            }}
          >
            {sample[1].name}
          </button>
        ))}
      </div>
      <h1>Samples: {Object.keys(samples).length}</h1>

      <div>
        Pkl
        <input
          type='radio'
          onChange={() => {
            setEditorLanguage('pkl')
          }}
          checked={editorLanguage === 'pkl'}
        />
        TypeScript
        <input
          type='radio'
          onChange={() => {
            setEditorLanguage('typescript')
          }}
          checked={editorLanguage === 'typescript'}
        />
      </div>

      {/* TODO: does this require calling out to the internet??? */}
      {isLoading ? (
        <h1>Loading</h1>
      ) : (
        <Editor
          defaultValue={editorLanguage === 'typescript' ? defaultTs : defaultPkl}
          editorLanguage={editorLanguage}
          onEditorMount={onEditorMount}
        />
      )}
    </div>
  )
}

export default App
