import { ChevronDown, Music } from 'lucide-react'
import type * as Tone from 'tone'

import { PLUGINS } from '@/src/lang/evaluate'

import type { SampleDetails } from '../load_samples'
import type { EditorLanguage } from './Editor'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './shadcn-ui/collapsible'
import { useToast } from './shadcn-ui/hooks/use-toast'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './shadcn-ui/select'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarSeparator,
} from './shadcn-ui/sidebar'

export function SamplesSidebar({
  samples,
  onLanguageChange,
  projects,
  selectedProjectId,
  onProjectChange,
}: {
  samples: (SampleDetails & { player?: Tone.Player })[]
  onLanguageChange: (value: EditorLanguage) => void
  projects: string[]
  selectedProjectId?: string
  onProjectChange: (projectId: string) => void
}) {
  const { toast } = useToast()
  return (
    <Sidebar variant='floating'>
      <SidebarHeader>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
          onClick={() => {
            navigator.clipboard
              .writeText(window.location.href)
              .then(() => toast({ description: 'URL copied to clipboard' }))
              .catch(() =>
                toast({ description: 'Unable to copy URL to clipboard', variant: 'destructive' }),
              )
          }}
        >
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
            <Music className='size-4' />
          </div>
          <div className='flex flex-col gap-0.5 leading-none'>
            <span className='font-semibold text-3xl'>Minuet</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Project</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <Select
                value={selectedProjectId}
                onValueChange={(value) => {
                  onProjectChange(value)
                }}
              >
                <SelectTrigger className='w-[180px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {projects.map((p) => (
                      <SelectItem value={p}>{p}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarGroup>
          <SidebarGroupLabel>Editor Language</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenuItem>
              <Select
                defaultValue='typescript' // TODO: use the default from the atom instead
                onValueChange={(value: EditorLanguage) => {
                  onLanguageChange(value)
                }}
              >
                <SelectTrigger className='w-[180px]'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Editor Language</SelectLabel>
                    {Object.entries(PLUGINS).map((plugin) => (
                      <SelectItem value={plugin[0]}>{plugin[1].name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </SidebarMenuItem>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <Collapsible defaultOpen className='group/collapsible'>
          <SidebarGroup>
            <SidebarGroupLabel asChild>
              <CollapsibleTrigger>
                Samples ({samples.length})
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
                          onContextMenu={(e) => {
                            e.preventDefault()
                            navigator.clipboard
                              .writeText(name)
                              .then(() =>
                                toast({ description: `Sample name "${name}" copied to clipboard` }),
                              )
                              .catch(() =>
                                toast({
                                  description: 'Unable to copy sample name to clipboard',
                                  variant: 'destructive',
                                }),
                              )
                          }}
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
