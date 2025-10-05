import { LuaFactory } from 'wasmoon'

import type { LanguagePlugin } from './types'

const luaFactory = new LuaFactory()

export const luaPlugin: LanguagePlugin = {
  name: 'Lua',
  render: async (contents) => {
    const lua = await luaFactory.createEngine()

    try {
      const result: unknown = await lua.doString(contents)

      if (result === null || result === undefined) {
        throw new Error('Lua code must return a value!')
      }
      return result
    } finally {
      lua.global.close()
    }
  },
}

export default luaPlugin
