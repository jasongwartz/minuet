import './App.css'

import type { OnMount } from '@monaco-editor/react'
import { Analytics } from '@vercel/analytics/react'
import { useAtom, useSetAtom } from 'jotai'
import type * as monaco from 'monaco-editor'
import * as prettier from 'prettier'
// Prettier plugins have empty .d.ts files, causing import/namespace warnings
// eslint-disable-next-line import/namespace
import * as prettierPluginEstree from 'prettier/plugins/estree'
import * as prettierPluginTypescript from 'prettier/plugins/typescript'
import { useEffect, useRef, useState } from 'react'
import type * as Tone from 'tone'
import { z, ZodError } from 'zod/v4'

import { execFromEditor } from '../lang/evaluate'
import { PLUGINS } from '../lang/plugins'
import type { Track } from '../ostinato'
import { Engine } from '../ostinato'
import type { EditorLanguage } from './components/Editor'
import Editor from './components/Editor'
import Header from './components/Header'
import { LiveSidebar } from './components/LiveSidebar'
import { SamplesSidebar } from './components/SamplesSidebar'
import { useToast } from './components/shadcn-ui/hooks/use-toast'
import { SidebarProvider } from './components/shadcn-ui/sidebar'
import { Toaster } from './components/shadcn-ui/toaster'
import defaultPkl from './default_pkl.txt?raw'
import defaultPython from './default_python.py?raw'
import defaultTs from './default_ts.ts?raw'
import defaultYaml from './default_yaml.yaml?raw'
import { getSamples, type SampleDetails } from './load_samples'
import { loadSample } from './load_samples'
import {
  currentBeatAtom,
  editorLanguageAtom,
  evaluatingStatusIndicatorAtom,
  schedulingStatusIndicatorAtom,
} from './state'

const App = () => {
  const [engineState, setEngine] = useState<Engine | null>(null)
  const [samples, setSamples] = useState<(SampleDetails & { player?: Tone.Player })[]>([])

  const { toast } = useToast()
  const setCurrentBeat = useSetAtom(currentBeatAtom)
  const setEvaluatingStatusIndicator = useSetAtom(evaluatingStatusIndicatorAtom)
  const setSchedulingStatusIndicator = useSetAtom(schedulingStatusIndicatorAtom)
  const [editorLanguage, setEditorLanguage] = useAtom(editorLanguageAtom)
  const editorLanguageRef = useRef(editorLanguage)
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null)

  useEffect(() => {
    getSamples()
      .then(async (sampleList) => {
        setSamples(sampleList)
        await Promise.all(
          sampleList.map(async (sample, index) => {
            const loaded = await loadSample(sample)
            const amended = samples
            amended[index] = loaded
            setSamples(amended)
          }),
        )
      })
      .then(() => {
        setEngine(
          new Engine(
            Object.fromEntries(
              Object.entries(samples)
                .filter(
                  (entry): entry is [string, SampleDetails & { player: Tone.Player }] =>
                    !!entry[1].player,
                )
                .map((entry) => [entry[1].name, entry[1].player]),
            ),
            {
              onEachBeat: (phrase, bar, beat) => {
                setCurrentBeat({ phrase, bar, beat })
              },
              onSchedulingStart: () => {
                setSchedulingStatusIndicator({ text: '...', colour: 'bg-red-500' })
              },
              onSchedulingComplete: (duration) => {
                setTrackNodes(engineRef.current?.tracks ?? [])
                setTimeout(() => {
                  setSchedulingStatusIndicator({
                    colour: 'bg-gray-200',
                    text: `${duration}ms`,
                  })
                }, 100)
              },
            },
          ),
        )
      })
      .catch(console.error)
  }, [])

  const samplesRef = useRef(samples)
  const engineRef = useRef(engineState)

  useEffect(() => {
    samplesRef.current = samples
  })
  useEffect(() => {
    engineRef.current = engineState
  })
  useEffect(() => {
    editorLanguageRef.current = editorLanguage
  })

  // Create a Prettier-based formatting provider for a given parser
  const createPrettierFormatter = (
    parser: 'typescript' | 'babel',
  ): monaco.languages.DocumentFormattingEditProvider => ({
    async provideDocumentFormattingEdits(model: monaco.editor.ITextModel) {
      const text = model.getValue()

      try {
        const formatted = await prettier.format(text, {
          parser,
          plugins: [prettierPluginTypescript, prettierPluginEstree],
          semi: false,
          singleQuote: true,
          tabWidth: 2,
          trailingComma: 'all',
          useTabs: false,
          printWidth: 100,
          arrowParens: 'always',
          bracketSpacing: true,
          jsxSingleQuote: true,
        })

        return [
          {
            range: model.getFullModelRange(),
            text: formatted,
          },
        ]
      } catch (error) {
        console.error('Prettier formatting failed:', error)
        return []
      }
    },
  })

  const onEditorMount: OnMount = (editor, monaco) => {
    editorRef.current = editor
    monaco.editor.setTheme('vs-light')

    // Register Prettier-based formatters to override Monaco's built-in formatters
    monaco.languages.registerDocumentFormattingEditProvider(
      'typescript',
      createPrettierFormatter('typescript'),
    )
    monaco.languages.registerDocumentFormattingEditProvider(
      'javascript',
      createPrettierFormatter('babel'),
    )

    const evaluateEditorCallback = () => {
      if (!engineRef.current) {
        toast({
          description: `Engine not yet started: loaded ${samplesRef.current.filter((s) => 'player' in s).length} out of ${samplesRef.current.length} samples`,
          variant: 'destructive',
        })
        return
      }
      const start = Date.now()
      setEvaluatingStatusIndicator({ colour: 'bg-green-500', text: '...' })
      execFromEditor(engineRef.current, editor.getValue(), editorLanguageRef.current)
        .then(async () => {
          await editor.getAction('editor.action.formatDocument')?.run()
          setTimeout(() => {
            setEvaluatingStatusIndicator({
              colour: 'bg-gray-200',
              text: `${Date.now() - start}ms`,
            })
          }, 100)
        })
        .catch((err: unknown) => {
          setEvaluatingStatusIndicator({
            colour: 'bg-red-500',
            text: `${Date.now() - start}ms`,
          })
          console.error(err)
          toast({
            title: `Error evaluating code${err instanceof Error ? `: ${err.name}` : ''}`,
            description:
              err instanceof ZodError
                ? z.prettifyError(err)
                : err instanceof Error
                  ? err.message
                  : 'Unknown error',
            variant: 'destructive',
          })
        })
    }
    editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Enter, evaluateEditorCallback)
    editor.addCommand(monaco.KeyMod.WinCtrl | monaco.KeyCode.Backslash, evaluateEditorCallback)
  }

  const [trackNodes, setTrackNodes] = useState<Track[]>([])

  const defaultContentsByLanguage: Partial<Record<EditorLanguage, string>> = {
    typescript: defaultTs,
    python: defaultPython,
    pkl: defaultPkl,
    yaml: defaultYaml,
  }

  return (
    <>
      <SidebarProvider>
        <SamplesSidebar
          samples={samples}
          onLanguageChange={(lang) => {
            // Check if current content matches the default for the current language
            const currentContent = editorRef.current?.getValue()
            const currentDefault = defaultContentsByLanguage[editorLanguage]
            const defaultContentsForNewLanguage = defaultContentsByLanguage[lang]

            // If content is still default, switch to new language's default
            if (
              defaultContentsForNewLanguage &&
              currentContent &&
              currentDefault &&
              currentContent === currentDefault
            ) {
              editorRef.current?.setValue(defaultContentsForNewLanguage)
            }

            setEditorLanguage(lang)
            if (PLUGINS[lang].register) {
              toast({
                description: `Loading plugin "${PLUGINS[lang].name}"`,
              })
              PLUGINS[lang]
                .register()
                .then(() => {
                  toast({ description: `Language plugin "${lang}" loaded successfully` })
                })
                .catch(console.error)
            }
          }}
        />
        <div className='w-full min-w-0'>
          <Header />

          <Editor
            defaultValue={defaultContentsByLanguage[editorLanguage] ?? ''}
            editorLanguage={editorLanguage}
            onEditorMount={onEditorMount}
          />
        </div>
        <LiveSidebar tracks={trackNodes} webmidi={engineRef.current?.webMidi} />
      </SidebarProvider>
      <Toaster />
      <Analytics />
    </>
  )
}

export default App
