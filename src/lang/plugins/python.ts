import PyodideWorkerApi from './python.workerApi'
import type { LanguagePlugin } from './types'

let workerApi: PyodideWorkerApi | null = null

export const pythonPlugin: LanguagePlugin = {
  name: 'Python',
  register: () => {
    // Initialize the worker API
    // The worker will load Pyodide when it receives its first message
    workerApi = new PyodideWorkerApi()
    return Promise.resolve()
  },
  render: async (contents) => {
    if (!workerApi) {
      throw new Error('Python plugin not loaded!')
    }
    const result = await workerApi.runPython(contents)
    return result
  },
}

export default pythonPlugin
