import { loadPyodide, version as pyodideVersion } from 'pyodide'

interface PyodideMessage {
  id: number
  python: string
}

interface PyodideResponse {
  id: number
  results?: unknown
  error?: string
}

let pyodide: Awaited<ReturnType<typeof loadPyodide>> | null = null

async function loadPyodideOnce() {
  pyodide ??= await loadPyodide({
    // TODO: Load Pyodide from Vite bundle, so that it can work offline:
    // https://pyodide.org/en/stable/usage/working-with-bundlers.html#vite
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${pyodideVersion}/full/`,
  })

  return pyodide
}

self.onmessage = async (event: MessageEvent<PyodideMessage>) => {
  const { id, python } = event.data

  try {
    const pyodideInstance = await loadPyodideOnce()

    // Load packages required by the Python code
    await pyodideInstance.loadPackagesFromImports(python)

    // Execute the Python code
    const output: unknown = await pyodideInstance.runPythonAsync(python)

    if (typeof output !== 'string') {
      throw new Error('Python output must be a string! (eg. using `json.dumps()`)')
    }

    const result: unknown = JSON.parse(output)

    const response: PyodideResponse = {
      id,
      results: result,
    }

    self.postMessage(response)
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    const response: PyodideResponse = {
      id,
      error: errorMessage,
    }
    self.postMessage(response)
  }
}
