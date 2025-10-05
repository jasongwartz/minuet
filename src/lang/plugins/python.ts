import { loadPyodide, version as pyodideVersion } from 'pyodide'

import type { LanguagePlugin } from './types'

let pyodide: Awaited<ReturnType<typeof loadPyodide>> | null = null

export const pythonPlugin: LanguagePlugin = {
  name: 'Python',
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
    if (!pyodide) {
      throw new Error('Python plugin not loaded!')
    }
    await pyodide.loadPackagesFromImports(contents)
    const output: unknown = await pyodide.runPythonAsync(contents)
    console.log(typeof output)
    if (typeof output !== 'string') {
      throw new Error('Python output must be a string! (eg. using `json.dumps()`)')
    }
    const result: unknown = JSON.parse(output)
    return result
  },
}

export default pythonPlugin
