import { loadPyodide, version as pyodideVersion } from 'pyodide'
import { transpile } from 'typescript'
import { z } from 'zod/v4'

import type { Engine, OstinatoSchema } from '../ostinato'
import { ostinatoSchema } from '../ostinato/schema'
import type { EditorLanguage } from '../ui/components/Editor'

interface LanguagePlugin {
  register?: () => Promise<void>
  render: (contents: string) => Promise<unknown>
}

const typescriptPlugin: LanguagePlugin = {
  render: (contents) => {
    const transpiled = transpile(contents)
    // TODO: Validate parsed instead of assertion

    // Use "indirect eval" for a small amount more safety:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_direct_eval!
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/consistent-type-assertions
    return Promise.resolve(eval?.(`"use strict"; ${transpiled}`) as unknown)
  },
}

const pklPlugin: LanguagePlugin = {
  render: async (contents) => {
    const start = Date.now()
    const response = await // fetch('https://pkl-playground.vercel.app/api/pkl/evaluate', {
    fetch('http://localhost:3000/api/pkl/evaluate', {
      method: 'POST',
      body: JSON.stringify({ pklInput: contents, outputFormat: 'json' }),
    })

    console.log('Pkl request took', Date.now() - start)
    const respJson: unknown = await response.json()
    if (
      !(
        respJson &&
        typeof respJson === 'object' &&
        'output' in respJson &&
        typeof respJson.output === 'string'
      )
    ) {
      throw new Error('Expected pkl evaluate call to contain `.output` of type string')
    }
    const respContents: unknown = JSON.parse(respJson.output)
    return respContents
  },
}

let pyodide: Awaited<ReturnType<typeof loadPyodide>> | null = null

const pythonPlugin: LanguagePlugin = {
  register: async () => {
    pyodide = await loadPyodide({
      // TODO: Load Pyodide from Vite bundle, so that it can work offline:
      // https://pyodide.org/en/stable/usage/working-with-bundlers.html#vite
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
    })
  },
  render: async (contents) => {
    // TODO: Run Pyodide in a web worker background thread:
    // https://pyodide.org/en/stable/usage/webworker.html
    const output: unknown = await pyodide?.runPythonAsync(contents)
    if (typeof output !== 'string') {
      throw new Error('Python output must be a string! (eg. using `json.dumps()`)')
    }
    const result: unknown = JSON.parse(output)
    return result
  },
}

// TODO: proper on-startup loading of modules!
void pythonPlugin.register?.()

const PLUGINS: Record<EditorLanguage, LanguagePlugin> = {
  pkl: pklPlugin,
  typescript: typescriptPlugin,
  python: pythonPlugin,
}

export const execFromEditor = async (
  engine: Engine,
  contents: string,
  editorLanguage: EditorLanguage,
) => {
  const plugin = PLUGINS[editorLanguage]
  // await plugin.register?.()
  console.log('rendering', editorLanguage)
  const evalutedOutput = await plugin.render(contents)

  const validation = ostinatoSchema.safeParse(evalutedOutput)
  if (!validation.success) {
    console.error(z.prettifyError(validation.error))
    throw validation.error
  }

  if (Object.keys(engine.samples).length) {
    engine.config = validation.data
    if (!engine.started) {
      await engine.start()
    }
  } else {
    console.log('samples was empty', engine.samples)
    console.log('engine was', engine)
  }
}
