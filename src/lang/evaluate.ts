import { z } from 'zod/v4'

import type { Engine } from '../ostinato'
import { ostinatoSchema } from '../ostinato/schema'
import type { EditorLanguage } from '../ui/components/Editor'
import { PLUGINS } from './plugins'

export const execFromEditor = async (
  engine: Engine,
  contents: string,
  editorLanguage: EditorLanguage,
) => {
  const pluginLoader = PLUGINS[editorLanguage]
  console.log(`Loading "${pluginLoader.name}" plugin...`)

  const plugin = await pluginLoader.load()
  console.log(`Rendering input using "${pluginLoader.name}" plugin`)

  if (plugin.register) {
    await plugin.register()
  }

  const evaluatedOutput = await plugin.render(contents)

  const validation = ostinatoSchema.safeParse(evaluatedOutput)
  if (!validation.success) {
    console.error(z.prettifyError(validation.error))
    throw validation.error
  }

  if (Object.keys(engine.samples).length) {
    engine.config = validation.data
    if (!engine.started) {
      await engine.start()
    }
  } else {
    console.log('samples was empty', engine.samples)
    console.log('engine was', engine)
  }
}
