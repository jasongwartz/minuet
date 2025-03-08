import { transpile } from 'typescript'

import type { Engine, OstinatoSchema } from '../ostinato'
import type { EditorLanguage } from '../ui/components/Editor'

export const execFromEditor = async (
  engine: Engine,
  contents: string,
  editorLanguage: EditorLanguage,
) => {
  let evaluatedOutput: OstinatoSchema

  const start = Date.now()
  if (editorLanguage === 'pkl') {
    const response = await // fetch('https://pkl-playground.vercel.app/api/pkl/evaluate', {
    fetch('http://localhost:3000/api/pkl/evaluate', {
      method: 'POST',
      body: JSON.stringify({ pklInput: contents, outputFormat: 'json' }),
    })

    console.log('request took', Date.now() - start)
    const respJson = (await response.json()) as unknown

    // TODO: Validate parsed instead of assertion
    evaluatedOutput = JSON.parse((respJson as { output: string }).output) as OstinatoSchema
  } else {
    const transpiled = transpile(contents)
    // TODO: Validate parsed instead of assertion

    // Use "indirect eval" for a small amount more safety:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_direct_eval!
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
    evaluatedOutput = eval?.(`"use strict"; ${transpiled}`) as OstinatoSchema
  }

  if (Object.keys(engine.samples).length) {
    engine.config = evaluatedOutput
    if (!engine.started) {
      await engine.start()
    }
  } else {
    console.log('samples was empty', engine.samples)
    console.log('engine was', engine)
  }
}
