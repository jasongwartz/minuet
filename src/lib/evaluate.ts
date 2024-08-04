import ts from 'typescript'

import type { Main } from '../../.out/main.pkl'
import type { EditorLanguage } from '../Editor'
import type { Engine } from '../ostinato/engine'

export const execFromEditor = async (engine: Engine, contents: string, editorLanguage: EditorLanguage) => {
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

  if (engine && Object.keys(engine.samples).length) {
    engine.instruments = evaluatedOutput.instruments
    if (!engine.started) {
      await engine.start()
    }
  } else {
    console.log('samples was empty', engine.samples)
    console.log('engine was', engine)
  }
}
