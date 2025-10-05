import MonacoEditor, { loader, type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

import type { PLUGINS } from '@/src/lang/plugins'

export type EditorLanguage = keyof typeof PLUGINS

interface EditorProps {
  onEditorMount: OnMount
  editorLanguage: EditorLanguage
  defaultValue: string
}

export default function Editor(props: EditorProps) {
  loader.config({ monaco })

  // Modified from: https://github.com/microsoft/monaco-editor/issues/2122#issuecomment-898307500
  window.MonacoEnvironment = {
    getWorker(_: string, label: string) {
      if (label === 'typescript' || label === 'javascript') return new TsWorker()
      return new EditorWorker()
    },
  }

  const syntaxHighlighterOverrides: Record<string, string> = {
    // Override editor syntax highlighter if necessary
    pkl: 'python',
  }

  const syntaxHighlightLanguage =
    syntaxHighlighterOverrides[props.editorLanguage] ?? props.editorLanguage

  return (
    <MonacoEditor
      height='100vh'
      language={syntaxHighlightLanguage}
      defaultValue={props.defaultValue}
      onMount={props.onEditorMount}
      options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, contextmenu: false }}
    />
  )
}
