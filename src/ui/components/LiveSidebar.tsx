import { Sidebar, SidebarContent, SidebarRail } from './shadcn-ui/sidebar'

export function LiveSidebar() {
  return (
    <Sidebar side='right'>
      <SidebarContent></SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
