'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTheme } from '@/components/theme-provider'
import { useAuth } from '@/components/auth-provider'
import { useDashboard } from '@/components/dashboard-provider'
import { usePlan } from '@/components/plan-provider'
import {
  Check,
  ChevronDown,
  LogOut,
  Menu as MenuIcon,
  Moon,
  RefreshCw,
  Search,
  Sun,
  Upload,
  X,
} from 'lucide-react'
import {
  Menu as HeadlessMenu,
  MenuButton,
  MenuItems,
  MenuItem,
} from '@headlessui/react'

export function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, logout } = useAuth()
  const { toggleSidebar } = useDashboard()
  const { query, setQuery, reload, setUploadOpen, loading } = usePlan()
  const router = useRouter()
  const pathname = usePathname()

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  const handleSearch = (value: string) => {
    setQuery(value)
    if (value && pathname !== '/' && pathname !== '/planos') router.push('/planos')
  }

  return (
    <header className="flex justify-between items-center flex-wrap gap-4 select-none">
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          aria-label="Abrir menu"
          className="p-1.5 rounded-lg text-ink hover:text-teal hover:bg-line/10 dark:hover:bg-line/5 transition-colors focus:outline-none border-none bg-transparent cursor-pointer flex items-center justify-center"
        >
          <MenuIcon className="w-5 h-5" />
        </button>
        <div className="flex flex-col">
          <h1 className="font-display font-bold text-[18px] text-ink leading-tight">
            Monitoramento do Planejamento Estratégico
          </h1>
          <p className="text-[12px] text-ink-soft mt-0.5">
            Governo do Estado de Pernambuco
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 text-[13px] text-ink-soft">
        <form
          role="search"
          className="relative w-full max-w-md"
          onSubmit={(e) => e.preventDefault()}
        >
          <Search className="pointer-events-none absolute top-1/2 left-2.5 w-4 h-4 -translate-y-1/2 text-ink-soft" />
          <input
            type="search"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Buscar objetivos, iniciativas e etapas…"
            className="h-9 w-full rounded-lg border border-line bg-panel pr-8 pl-8 text-[13px] text-ink placeholder:text-ink-soft focus:outline-none focus:ring-2 focus:ring-teal/40"
          />
          {query && (
            <button
              type="button"
              aria-label="Limpar busca"
              onClick={() => setQuery('')}
              className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 text-ink-soft hover:text-ink"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </form>

        <button
          onClick={() => reload()}
          aria-label="Sincronizar"
          title="Sincronizar com o backend"
          className="p-2 rounded-lg text-ink-soft hover:bg-line/10 hover:text-ink transition-colors cursor-pointer border-none bg-transparent"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>

        <button
          onClick={() => setUploadOpen(true)}
          aria-label="Carga de Dados"
          title="Carga de Dados"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal text-white text-[13px] font-medium hover:bg-teal/90 transition-colors cursor-pointer border-none"
        >
          <Upload className="w-4 h-4" />
          <span className="hidden sm:inline">Carga</span>
        </button>

        <button
          onClick={toggleTheme}
          aria-label="Alternar tema"
          suppressHydrationWarning
          className="p-2 rounded-lg text-ink-soft hover:bg-line/10 hover:text-ink transition-colors cursor-pointer border-none bg-transparent"
        >
          {theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <HeadlessMenu as="div" className="relative inline-block text-left">
          <MenuButton className="flex items-center gap-2.5 cursor-pointer rounded-lg p-1.5 hover:bg-line/10 transition-colors focus:outline-none select-none border-none bg-transparent text-left">
            <div className="w-8 h-8 rounded-full bg-teal/15 text-teal flex items-center justify-center text-[13px] font-bold select-none uppercase">
              {user?.initials ?? 'AR'}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-[12.5px] font-semibold text-ink leading-tight">
                {user?.name ?? 'Usuário'}
              </span>
              <span className="text-[11px] text-ink-soft leading-tight">
                {user?.email ?? ''}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-ink-soft" />
          </MenuButton>

          <MenuItems
            transition
            className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-lg bg-panel border border-line p-1 shadow-lg focus:outline-none transition duration-100 ease-out data-[closed]:scale-95 data-[closed]:opacity-0"
          >
            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={toggleTheme}
                  className={`flex w-full items-center justify-between rounded-md px-3 py-2 text-[13px] font-medium text-left cursor-pointer border-none bg-transparent transition-colors ${
                    focus ? 'bg-bg text-ink' : 'text-ink-soft'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    {theme === 'dark' ? <Moon className="w-4 h-4 text-teal" /> : <Sun className="w-4 h-4 text-ink-soft" />}
                    Modo escuro
                  </span>
                  {theme === 'dark' && <Check className="w-4 h-4 text-teal" />}
                </button>
              )}
            </MenuItem>

            <div className="my-1 h-px bg-line/40" />

            <MenuItem>
              {({ focus }) => (
                <button
                  onClick={handleLogout}
                  className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-[13px] font-medium text-left cursor-pointer border-none bg-transparent transition-colors ${
                    focus
                      ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400'
                      : 'text-ink-soft'
                  }`}
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              )}
            </MenuItem>
          </MenuItems>
        </HeadlessMenu>
      </div>
    </header>
  )
}