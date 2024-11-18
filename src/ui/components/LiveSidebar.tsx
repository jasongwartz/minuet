import { getDestination } from 'tone'

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from './shadcn-ui/card'
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarRail,
} from './shadcn-ui/sidebar'
import { SidebarCardVolumeMeter } from './SidebarCardVolumeMeter'

export function LiveSidebar() {
  return (
    <Sidebar variant='floating' side='right'>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Tracks</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarCardVolumeMeter title='Master' node={getDestination()} />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
