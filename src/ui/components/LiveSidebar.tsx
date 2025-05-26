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
            <SidebarVolumeCard title='Master' node={getDestination()} />
            {tracks
              .filter((t): t is Track & { node: ToneAudioNode } => t.node !== undefined)
              .map(({ config, node }) => {
                const name =
                  config.id ??
                  ('synth' in config
                    ? typeof config.synth === 'string'
                      ? config.synth
                      : `MIDI ${config.synth.output}`
                    : 'external' in config
                      ? 'external'
                      : config.sample.name)
                // Use the `phrase` value to force rerendering when config and name stays the same,
                // but the Tone node changes.
                // TODO: Remove this when Tone.Player instances are held across phrases as long
                // as config doesn't change.
                return (
                  <SidebarVolumeCard
                    key={name + `-${currentPhrase ?? 0}`}
                    title={name}
                    node={node}
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
