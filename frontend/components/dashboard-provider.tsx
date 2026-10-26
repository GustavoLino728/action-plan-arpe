'use client'

import * as React from 'react'
import { usePathname } from 'next/navigation'

interface DashboardContextType {
  isMobileOpen: boolean
  setIsMobileOpen: (open: boolean) => void
  isDesktopOpen: boolean
  setIsDesktopOpen: (open: boolean) => void
  toggleSidebar: () => void
}

const DashboardContext = React.createContext<DashboardContextType | undefined>(undefined)

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [isMobileOpen, setIsMobileOpen] = React.useState(false)
  const [isDesktopOpen, setIsDesktopOpen] = React.useState(true)

  React.useEffect(() => {
    const timer = window.setTimeout(() => setIsMobileOpen(false), 0)
    return () => window.clearTimeout(timer)
  }, [pathname])

  const toggleSidebar = React.useCallback(() => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen((prev) => !prev)
    } else {
      setIsDesktopOpen((prev) => !prev)
    }
  }, [])

  const value = React.useMemo<DashboardContextType>(
    () => ({ isMobileOpen, setIsMobileOpen, isDesktopOpen, setIsDesktopOpen, toggleSidebar }),
    [isMobileOpen, isDesktopOpen, toggleSidebar],
  )

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>
}

export function useDashboard() {
  const ctx = React.useContext(DashboardContext)
  if (!ctx) throw new Error('useDashboard deve ser usado dentro de <DashboardProvider>')
  return ctx
}