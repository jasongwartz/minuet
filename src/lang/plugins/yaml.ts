import { parse as yamlParse } from 'yaml'

import type { LanguagePlugin } from './types'

export const yamlPlugin: LanguagePlugin = {
  name: 'YAML',
  render: (contents) => Promise.resolve(yamlParse(contents)),
}

export default yamlPlugin
