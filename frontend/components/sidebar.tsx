'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'

import { useAuth } from '@/components/auth-provider'
import { useDashboard } from '@/components/dashboard-provider'
import { NAV_ITEMS } from '@/lib/nav-items'

export function Sidebar() {
  const pathname = usePathname()
  const { isMobileOpen, setIsMobileOpen, isDesktopOpen } = useDashboard()
  const { user, isLoading } = useAuth()

  const itensVisiveis = isLoading
    ? []
    : NAV_ITEMS.filter((item) =>
        item.visivel ? item.visivel(user) : true,
      )

  return (
    <>
      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/45 transition-opacity duration-300 lg:hidden cursor-pointer"
        />
      )}

      <aside
        className={`flex shrink-0 flex-col overflow-y-auto border-r border-line/10 bg-sidebar py-5 text-[#C3D0DC] select-none transition-all duration-300 ease-in-out
          lg:relative lg:z-30
          ${isDesktopOpen ? 'lg:w-[220px] lg:opacity-100 lg:pointer-events-auto' : 'lg:w-0 lg:opacity-0 lg:pointer-events-none lg:border-r-0 lg:py-0'}
          max-lg:fixed max-lg:inset-y-0 max-lg:left-0 max-lg:z-50 max-lg:w-[240px] max-lg:shadow-2xl
          ${isMobileOpen ? 'max-lg:translate-x-0' : 'max-lg:-translate-x-full'}
        `}
      >
        <div className="flex items-center justify-between px-5 pb-6 max-lg:pb-4">
          <Link href="/" className="flex items-center">
            <img
              src="/logo-arpe-negativo.png"
              alt="ARPE MAP"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <button
            onClick={() => setIsMobileOpen(false)}
            aria-label="Fechar menu"
            className="flex items-center justify-center rounded-lg p-1.5 text-[#8A9DB0] transition-colors hover:bg-white/10 hover:text-white focus:outline-none border-none bg-transparent cursor-pointer lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-1">
          <ul className="m-0 flex w-full list-none flex-col gap-1 p-0">
            {itensVisiveis.map((item) => {
              const Icon = item.icon
              const isActive = pathname === item.href
              return (
                <li key={item.href} className="w-full">
                  <Link
                    href={item.href}
                    className={`mx-2 flex items-center gap-3 rounded-lg px-5 py-[9px] text-[13.5px] no-underline transition-all duration-150 ${
                      isActive
                        ? 'font-semibold text-white'
                        : 'text-[#8A9DB0] hover:text-[#C3D0DC]'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-teal' : ''}`} />
                    <span>{item.name}</span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </aside>
    </>
  )
}