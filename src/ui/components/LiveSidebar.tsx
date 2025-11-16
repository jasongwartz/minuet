import { useAtom } from 'jotai'
import type { ToneAudioNode } from 'tone'
import { getDestination } from 'tone'
import type { WebMidi } from 'webmidi'

import type { Track } from '@/src/ostinato'

import { currentPhraseAtom } from '../state'
import { MidiDebugCard } from './MidiDebugCard'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
} from './shadcn-ui/sidebar'
import { SidebarVolumeCard } from './SidebarCardVolumeMeter'

export function LiveSidebar({ tracks, webmidi }: { tracks: Track[]; webmidi?: typeof WebMidi }) {
  const [currentPhrase] = useAtom(currentPhraseAtom)

  return (
    <Sidebar variant='floating' side='right'>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tracks ({tracks.length})</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarVolumeCard
              title='Master'
              node={getDestination()}
              phraseVersion={currentPhrase ?? 0}
            />
            {tracks
              .filter((t): t is Track & { node: ToneAudioNode } => t.node !== undefined)
              .map(({ config, node }, index) => {
                const name =
                  config.id ??
                  ('synth' in config
                    ? typeof config.synth === 'string'
                      ? config.synth
                      : `MIDI ${config.synth.output}`
                    : 'external' in config
                      ? 'external'
                      : config.sample.name)
                // Keep keys stable so the volume meters can reuse their Tone.Meter instances while still
                // reacting to the `node` prop changing between phrases.
                return (
                  <SidebarVolumeCard
                    key={`${config.id ?? name}-${index}`}
                    title={name}
                    node={node}
                    phraseVersion={currentPhrase ?? 0}
                  />
                )
              })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        {webmidi !== undefined && webmidi.inputs.length !== 0 && (
          <MidiDebugCard webmidi={webmidi} />
        )}
      </SidebarFooter>
    </Sidebar>
  )
}
