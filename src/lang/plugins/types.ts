export interface LanguagePlugin {
  name: string
  register?: () => Promise<void>
  render: (contents: string) => Promise<unknown>
}
