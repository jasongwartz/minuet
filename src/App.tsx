import './App.css'

import type { OnMount } from '@monaco-editor/react'
import { useEffect, useRef, useState } from 'react'
import type * as Tone from 'tone'

import { LogsContainer } from './Console'
import Editor, { type EditorLanguage } from './Editor'
import { execFromEditor } from './lib/evaluate'
import { getSamples, type SampleDetails } from './lib/load_samples'
import { loadSamples } from './lib/load_samples'
import { Engine } from './ostinato/engine'

const App = () => {
  const [isLoading, setIsLoading] = useState(false)

  const [samples, setSamples] = useState({} as (Record<string, SampleDetails & { player: Tone.Player }>))
  const [engineState, setEngine] = useState<Engine | null>(null)

  useEffect(() => {
    console.log('loading samples')
    getSamples().then(loadSamples)
      .then((players) => {
        setSamples(Object.fromEntries(players.map((p) => [p.name, p])))
        setIsLoading(false)
        setEngine(new Engine(Object.fromEntries(players.map((p) => [p.name, p.player]))))
      }).catch(console.error)
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
        execFromEditor(
          engineRef.current,
          editor.getValue(),
          editorLanguage,
        ).catch(console.error)
      }
    })
  }

  const [editorLanguage, setEditorLanguage] = useState<EditorLanguage>('pkl')

  const defaultValue = `
typealias Effect = "flanger"|"lpf"

typealias Synth = "FMSynth"|"AMSynth"

class Instrument {
    synth: Synth?
    sample: String?
    on: Listing<String>
    with: Listing<Effect>
}

instruments: Listing<Instrument> = new {
  new {
      sample = "bass_drum"
      on { "0" "1m" "2m" "3m" }
      with {}
  }
  new {
    sample = "hi_hat"
    on { "0:1" "0:3" "1:1" "1:3" "2:1" "2:3" }
  }
}
`

  return <div>
    <div>
      { Object.entries(samples).map((sample) =>
        <button onClick={() => {
          sample[1].player.toDestination().start(0)
        }}>{sample[1].name}</button>,
      ) }
    </div>
    <h1>
      Samples: {Object.keys(samples).length}
    </h1>

    <div>
        Pkl
      <input type="radio" onChange={() => setEditorLanguage('pkl')} checked={editorLanguage === 'pkl'}  />
        TypeScript
      <input type="radio" onChange={() => setEditorLanguage('typescript')} checked={editorLanguage === 'typescript'}  />
    </div>

    {/* TODO: does this require calling out to the internet??? */}
    {isLoading ? <h1>Loading</h1> : <Editor defaultValue={defaultValue} editorLanguage={editorLanguage} onEditorMount={onEditorMount} />}

    <LogsContainer />
  </div>
}

export default App
