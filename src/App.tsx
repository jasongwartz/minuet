import './App.css'

import type { OnChange, OnMount } from '@monaco-editor/react'
import Editor from '@monaco-editor/react'
import * as Tone from 'tone'
import ts from 'typescript'

import { LogsContainer } from './Console'

const App = () => {
  let contents: string = ''
  const handleEditorChange: OnChange = (value) => contents = value ?? ''
  const execFromEditor = () => {
    const start = Date.now()
    const transpiled = ts.transpile(contents)
    console.log(`Transpilation took: ${Date.now() - start}ms`)
    eval(transpiled)
  }

  // TODO: find a new way to force Tone.js to be globally available in the browser context
  new Tone.Synth()

  const handleEditorMount: OnMount = (editor, monaco) => {
    const modules = import.meta.glob('../node_modules/tone/build/**/*.d.ts', { as: 'raw', eager: true })
    monaco.languages.typescript.typescriptDefaults.addExtraLib(`declare module Tone { ${Object.values(modules).join('\n')} }`, 'file:///tone')

    editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter, () => {
      execFromEditor()
    })
  }

  const defaultValue = `
// //create a synth and connect it to the main output (your speakers)
// const synth = new Tone.Synth().toDestination();

// //play a middle 'C' for the duration of an 8th note
// synth.triggerAttackRelease("C4", "8n");
`

  return <div>
    <div>
      <button onClick={execFromEditor}>Exec</button>
    </div>
    <Editor
      height="60vh"
      width="90vw"
      defaultLanguage="typescript"
      defaultValue={defaultValue}
      onChange={handleEditorChange}
      onMount={handleEditorMount}
      options={ { minimap: { enabled: false } } }
    />;
    <LogsContainer />
  </div>
}

export default App
