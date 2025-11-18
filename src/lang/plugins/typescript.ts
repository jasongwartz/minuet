import { transpile } from 'typescript'

import type { LanguagePlugin } from './types'

export const typescriptPlugin: LanguagePlugin = {
  name: 'TypeScript',
  render: (contents) => {
    const transpiled = transpile(contents)
    // TODO: Validate parsed instead of assertion

    // Use "indirect eval" for a small amount more safety:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#never_use_direct_eval!
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition, @typescript-eslint/consistent-type-assertions
    return Promise.resolve(eval?.(`"use strict"; ${transpiled}`) as unknown)
  },
}

export default typescriptPlugin
