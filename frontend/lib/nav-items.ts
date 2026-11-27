import type * as React from 'react'
import { BarChart3, Building2Icon, FileText, LineChart, Upload, UsersIcon, CalendarIcon } from 'lucide-react'

import type { UserSession } from '@/lib/api/client'
import {
  canImportSpreadsheet,
  canManageDepartments,
  canManageUsers,
} from '@/lib/roles'

export type NavItem = {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  visivel?: (user: UserSession | null) => boolean
}

export const NAV_ITEMS: NavItem[] = [
  { name: 'Mapa Estratégico', href: '/', icon: BarChart3 },
  { name: 'Planos de Ação', href: '/planos', icon: FileText },
  { name: 'Dashboard', href: '/dashboard', icon: LineChart },
  { name: 'Calendário', href: '/calendar', icon: CalendarIcon },
  { name: 'Carga de Planilhas', href: '/planilhas', icon: Upload, visivel: canImportSpreadsheet },
  { name: 'Usuários', href: '/usuarios', icon: UsersIcon, visivel: canManageUsers },
  { name: 'Setores', href: '/departments', icon: Building2Icon, visivel: canManageDepartments },
]