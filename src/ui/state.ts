import { atom } from 'jotai'

import type { EditorLanguage } from './components/Editor'

export interface CurrentBeat {
  phrase: number
  bar: number
  beat: number
}

export const currentBeatAtom = atom<CurrentBeat | null>(null)

export const currentPhraseAtom = atom((get) => get(currentBeatAtom)?.phrase)

export const evaluatingStatusIndicatorAtom = atom<{
  colour: 'bg-gray-200' | 'bg-red-500' | 'bg-green-500'
  text: string
}>({
  colour: 'bg-gray-200',
  text: '...',
})

export const schedulingStatusIndicatorAtom = atom<{
  colour: 'bg-gray-200' | 'bg-red-500'
  text: string
}>({
  colour: 'bg-gray-200',
  text: '...',
})

export const editorLanguageAtom = atom<EditorLanguage>('python')
