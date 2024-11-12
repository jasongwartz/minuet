import { ChevronDown } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './shadcn-ui/collapsible'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
} from './shadcn-ui/sidebar'
import { SampleDetails } from '../load_samples'
import * as Tone from 'tone'

export function SamplesSidebar({
  samples,
}: {
  samples: (SampleDetails & { player?: Tone.Player })[]
}) {
  console.log(samples.length)
  return (
    <Sidebar>
      <SidebarContent>
        <Collapsible defaultOpen className='group/collapsible'>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Samples
                <ChevronDown className='ml-auto transition-transform group-data-[state=open]/collapsible:rotate-180' />
              </CollapsibleTrigger>
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <CollapsibleContent>
                <SidebarMenu>
                  {samples.map(({ name, player }, index) => (
                    <SidebarMenuItem key={index}>
                      {player ? (
                        <SidebarMenuButton
                          onClick={() =>
                            player.state === 'stopped'
                              ? player.toDestination().start(0)
                              : player.stop()
                          }
                        >
                          {name}
                        </SidebarMenuButton>
                      ) : (
                        <SidebarMenuSkeleton />
                      )}
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </CollapsibleContent>
            </SidebarGroupContent>
          </SidebarGroup>
        </Collapsible>
      </SidebarContent>
    </Sidebar>
  )
}
