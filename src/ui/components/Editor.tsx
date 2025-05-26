import MonacoEditor, { loader, type OnMount } from '@monaco-editor/react'
import * as monaco from 'monaco-editor'
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker?worker'

export type EditorLanguage = 'pkl' | 'typescript' | 'python'

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

  return (
    <MonacoEditor
      height='100vh'
      language={
        props.editorLanguage === 'typescript' ? 'typescript' : 'python' /* TODO: pkl? groovy? */
      }
      defaultValue={props.defaultValue}
      onMount={props.onEditorMount}
      options={{ minimap: { enabled: false }, scrollBeyondLastLine: false, contextmenu: false }}
    />
  )
}
