import type { OnMount } from '@monaco-editor/react'
import MonacoEditor from '@monaco-editor/react'
import { loader } from '@monaco-editor/react'
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
      height='60vh'
      width='60vw'
      className='jason'
      language={
        props.editorLanguage === 'typescript' ? 'typescript' : 'python' /* TODO: pkl? groovy? */
      }
      defaultValue={props.defaultValue}
      // onChange={handleEditorChange}
      onMount={props.onEditorMount}
      options={{ minimap: { enabled: false } }}
    />
  )
}
