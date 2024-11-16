import { ChevronDown, Music } from 'lucide-react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './shadcn-ui/collapsible'
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
  SidebarRail,
} from './shadcn-ui/sidebar'
import { SampleDetails } from '../load_samples'
import * as Tone from 'tone'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from './shadcn-ui/select'

export function SamplesSidebar({
  samples,
  onLanguageChange,
}: {
  samples: (SampleDetails & { player?: Tone.Player })[]
  onLanguageChange: (value: 'pkl' | 'typescript') => void
}) {
  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenuButton
          size='lg'
          className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
        >
          <div className='flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground'>
            <Music className='size-4' />
          </div>
          <div className='flex flex-col gap-0.5 leading-none'>
            <span className='font-semibold text-3xl'>Minuet</span>
          </div>
        </SidebarMenuButton>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Editor Language</SidebarGroupLabel>
          <SidebarMenuItem>
            <Select
              defaultValue='typescript'
              onValueChange={(value: 'pkl' | 'typescript') => onLanguageChange(value)}
            >
              <SelectTrigger className='w-[180px]'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Editor Language</SelectLabel>
                  <SelectItem value='typescript'>TypeScript</SelectItem>
                  <SelectItem value='pkl'>Pkl</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </SidebarMenuItem>
        </SidebarGroup>
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
      <SidebarRail />
    </Sidebar>
  )
}
