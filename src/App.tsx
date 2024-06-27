import './App.css'

import type { OnChange, OnMount } from '@monaco-editor/react'
import Editor from '@monaco-editor/react'
import type { editor } from 'monaco-editor'
import { useEffect, useRef, useState } from 'react'
import * as Tone from 'tone'
import ts from 'typescript'

import type { Main } from '../.out/main.pkl'
import { LogsContainer } from './Console'
import type { SampleDetails } from './lib/engine'
import { Engine, getSamples } from './lib/engine'

const App = () => {
  const [isLoading, setIsLoading] = useState(false)

  const [samples, setSamples] = useState({} as (Record<string, SampleDetails & { player: Tone.Player }>))
  const [engineState, setEngine] = useState<Engine | null>(null)

  useEffect(() => {
    console.log('loading samples')
    getSamples().then(async (results) => {
      const players = await Promise.all(results.map(async (result) => {
        console.log(`loading: ${result.name}`)
        const player =  new Tone.Player()
        await player.load(`https://chopsticks.vercel.app/${result.file}`)
        console.log(`loaded: ${result.name}`)

        return { ...result, player }
      }))

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


  const handleEditorMount: OnMount = (editor, monaco) => {
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
      execFromEditor(editor).catch(console.error)
    })
  }

  type EditorLanguage = 'pkl' | 'typescript'
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
  const execFromEditor = async (editor: editor.IStandaloneCodeEditor) => {
    const contents = editor.getValue()
    const engine = engineRef.current

    let evaluatedOutput: Main

    const start = Date.now()
    if (editorLanguage === 'pkl') {
      const response = await
      // fetch('https://pkl-playground.vercel.app/api/pkl/evaluate', {
      fetch('http://localhost:3000/api/pkl/evaluate', {
        method: 'POST',
        body: JSON.stringify({ pklInput: contents, outputFormat: 'json' }) ,
      })

      console.log('request took', Date.now() - start)
      const respJson = await response.json() as unknown

      // TODO: Validate parsed instead of assertion
      evaluatedOutput = JSON.parse((respJson as { output: string }).output) as Main

    } else {
      const transpiled = ts.transpile(contents)
      console.log('TypeScript transpilation took', Date.now() - start)

      // TODO: Validate parsed instead of assertion
      evaluatedOutput = eval(transpiled) as Main
    }


    if (engine && Object.keys(samplesRef.current).length) {
      engine.instruments = evaluatedOutput.instruments
      if (!engine.started) {
        await engine.start()
      }
    } else {
      console.log('samples was empty', samples)
      console.log('engine was', engine)
    }
  }


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
    {isLoading ? <h1>Loading</h1> : <Editor
      height="60vh"
      width="60vw"
      className='jason'
      language={editorLanguage === 'typescript' ? 'typescript' : 'python' /* TODO: pkl? groovy? */ }
      defaultValue={defaultValue}
      // onChange={handleEditorChange}
      onMount={handleEditorMount}
      options={ { minimap: { enabled: false } } }
    />}

    <LogsContainer />
  </div>
}

export default App
