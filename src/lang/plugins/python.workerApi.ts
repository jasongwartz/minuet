interface PyodideMessage {
  id: number
  python: string
}

interface PyodideResponse {
  id: number
  results?: unknown
  error?: string
}

class PyodideWorkerApi {
  private worker: Worker
  private nextId = 0
  private callbacks = new Map<number, (value: unknown) => void>()
  private errors = new Map<number, (error: Error) => void>()

  constructor() {
    this.worker = new Worker(new URL('./python.worker.ts', import.meta.url), {
      type: 'module',
    })

    this.worker.onmessage = (event: MessageEvent<PyodideResponse>) => {
      const { id, results, error } = event.data

      if (error) {
        const errorCallback = this.errors.get(id)
        if (errorCallback) {
          errorCallback(new Error(error))
          this.errors.delete(id)
          this.callbacks.delete(id)
        }
      } else {
        const callback = this.callbacks.get(id)
        if (callback) {
          callback(results)
          this.callbacks.delete(id)
          this.errors.delete(id)
        }
      }
    }

    this.worker.onerror = (event) => {
      console.error('Worker error:', event)
      // Reject all pending promises
      this.errors.forEach((reject) => {
        reject(new Error('Worker encountered an error'))
      })
      this.callbacks.clear()
      this.errors.clear()
    }
  }

  async runPython(python: string): Promise<unknown> {
    const id = this.nextId++

    return new Promise((resolve, reject) => {
      this.callbacks.set(id, resolve)
      this.errors.set(id, reject)

      const message: PyodideMessage = {
        id,
        python,
      }

      this.worker.postMessage(message)
    })
  }

  terminate() {
    this.worker.terminate()
    this.callbacks.clear()
    this.errors.clear()
  }
}

export default PyodideWorkerApi
