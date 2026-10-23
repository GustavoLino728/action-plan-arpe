'use client'

import { BarChart3Icon, ClipboardListIcon, FileSpreadsheetIcon, NetworkIcon } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArpeLogo, ArpeMark } from '@/components/arpe-logo'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'

const NAV = [
  { href: '/', label: 'Mapa Estratégico', icon: NetworkIcon },
  { href: '/planos', label: 'Planos de Ação', icon: ClipboardListIcon },
  { href: '/carga', label: 'Carga de Planilhas', icon: FileSpreadsheetIcon },
  { href: '/relatorios', label: 'Relatórios Executivos', icon: BarChart3Icon },
]

export function AppSidebar() {
  const pathname = usePathname()
  const { state } = useSidebar()

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-14 justify-center bg-header p-0 px-3 text-header-foreground">
        {state === 'collapsed' ? <ArpeMark /> : <ArpeLogo />}
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Planejamento Estratégico</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {NAV.map((item) => {
                const active = item.href === '/' ? pathname === '/' : pathname.startsWith(item.href)
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      isActive={active}
                      tooltip={item.label}
                      render={<Link href={item.href} aria-current={active ? 'page' : undefined} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
