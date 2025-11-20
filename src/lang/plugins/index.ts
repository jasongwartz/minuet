import type { LanguagePlugin } from './types'

export type { LanguagePlugin } from './types'

// Lazy-load plugins to reduce initial bundle size
export const PLUGINS = {
  pkl: {
    name: 'Pkl',
    load: () => import('./pkl').then((m) => m.pklPlugin),
  },
  typescript: {
    name: 'TypeScript',
    load: () => import('./typescript').then((m) => m.typescriptPlugin),
  },
  python: {
    name: 'Python',
    load: () => import('./python').then((m) => m.pythonPlugin),
  },
  lua: {
    name: 'Lua',
    load: () => import('./lua').then((m) => m.luaPlugin),
  },
  yaml: {
    name: 'YAML',
    load: () => import('./yaml').then((m) => m.yamlPlugin),
  },
} satisfies Record<string, { name: string; load: () => Promise<LanguagePlugin> }>
