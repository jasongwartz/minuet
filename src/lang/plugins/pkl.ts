import type { LanguagePlugin } from './types'

export const pklPlugin: LanguagePlugin = {
  name: 'Pkl',
  render: async (contents) => {
    const start = Date.now()
    const response = await fetch('http://localhost:3000/api/pkl/evaluate', {
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

export default pklPlugin
