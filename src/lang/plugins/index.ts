import { luaPlugin } from './lua'
import { pklPlugin } from './pkl'
import { pythonPlugin } from './python'
import type { LanguagePlugin } from './types'
import { typescriptPlugin } from './typescript'
import { yamlPlugin } from './yaml'

export type { LanguagePlugin } from './types'
export { pklPlugin, pythonPlugin, typescriptPlugin, luaPlugin, yamlPlugin }

export const PLUGINS = {
  pkl: pklPlugin,
  typescript: typescriptPlugin,
  python: pythonPlugin,
  lua: luaPlugin,
  yaml: yamlPlugin,
} satisfies Record<string, LanguagePlugin>
