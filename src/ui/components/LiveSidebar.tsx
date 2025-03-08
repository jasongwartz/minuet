import type { ToneAudioNode } from 'tone'
import { getDestination } from 'tone'

import type { Track } from '@/src/ostinato'

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
} from './shadcn-ui/sidebar'
import { SidebarCardVolumeMeter } from './SidebarCardVolumeMeter'

export function LiveSidebar({ tracks, phrase }: { tracks: Track[]; phrase: number }) {
  return (
    <Sidebar variant='floating' side='right'>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tracks ({tracks.length})</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarCardVolumeMeter title='Master' node={getDestination()} />
            {tracks
              .filter((t): t is Track & { node: ToneAudioNode } => t.node !== undefined)
              .map(({ config, node }) => {
                const name = config.id ?? ('synth' in config ? config.synth : config.sample.name)
                // Use the `phrase` value to force rerendering when config and name stays the same,
                // but the Tone node changes.
                // TODO: Remove this when Tone.Player instances are held across phrases as long
                // as config doesn't change.
                return <SidebarCardVolumeMeter key={name + `-${phrase}`} title={name} node={node} />
              })}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
