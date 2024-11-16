import MonacoEditor, { loader, type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'

export type EditorLanguage = 'pkl' | 'typescript'

interface EditorProps {
  onEditorMount: OnMount
  editorLanguage: EditorLanguage
  defaultValue: string
}

export default function Editor(props: EditorProps) {
  loader.config({ monaco })

  return (
    <MonacoEditor
      height='100vh'
      language={
        props.editorLanguage === 'typescript' ? 'typescript' : 'python' /* TODO: pkl? groovy? */
      }
      defaultValue={props.defaultValue}
      onMount={props.onEditorMount}
      options={{ minimap: { enabled: false }, scrollBeyondLastLine: false }}
    />
  )
}
