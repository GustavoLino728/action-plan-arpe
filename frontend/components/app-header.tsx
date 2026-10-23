'use client'

import {
  ChevronDownIcon,
  LogOutIcon,
  RefreshCwIcon,
  SearchIcon,
  SettingsIcon,
  UploadIcon,
  UserIcon,
  XIcon,
} from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { toast } from 'sonner'

import { usePlan } from '@/components/plan-provider'
import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { clearStoredTokens } from '@/lib/api/client'

export function AppHeader() {
  const { query, setQuery, setUploadOpen, currentUser, loading, reload } = usePlan()
  const pathname = usePathname()
  const router = useRouter()

  function handleSearch(value: string) {
    setQuery(value)
    if (value && pathname !== '/' && pathname !== '/planos') router.push('/planos')
  }

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 bg-header px-3 text-header-foreground shadow-sm sm:gap-3 sm:px-4">
      <SidebarTrigger className="text-header-foreground hover:bg-white/10 hover:text-header-foreground" />
      <div className="hidden min-w-0 flex-col leading-tight lg:flex">
        <span className="text-sm font-semibold">Monitoramento do Planejamento Estratégico</span>
        <span className="text-[11px] opacity-80">Governo do Estado de Pernambuco</span>
      </div>

      <form role="search" className="relative ml-auto w-full max-w-md flex-1" onSubmit={(e) => e.preventDefault()}>
        <SearchIcon aria-hidden className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 opacity-70" />
        <Input
          type="search"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Buscar objetivos, iniciativas e etapas…"
          aria-label="Buscar em objetivos estratégicos, iniciativas e etapas"
          className="h-9 border-white/20 bg-white/10 pr-8 pl-8 text-header-foreground placeholder:text-white/60 focus-visible:border-white/50 focus-visible:ring-white/20 dark:bg-white/10 [&::-webkit-search-cancel-button]:hidden"
        />
        {query && (
          <button
            type="button"
            aria-label="Limpar busca"
            onClick={() => setQuery('')}
            className="absolute top-1/2 right-2 -translate-y-1/2 rounded-sm p-0.5 opacity-70 hover:opacity-100"
          >
            <XIcon className="size-4" />
          </button>
        )}
      </form>

      <Button
        onClick={() => {
          reload()
          toast.success('Sincronizado com o backend.')
        }}
        size="icon"
        variant="ghost"
        aria-label="Sincronizar com o backend"
        title="Sincronizar com o backend"
        className="h-8 w-8 text-header-foreground hover:bg-white/10 hover:text-header-foreground"
      >
        <RefreshCwIcon className={`size-4 ${loading ? 'animate-spin' : ''}`} />
      </Button>

      <Button
        onClick={() => setUploadOpen(true)}
        size="sm"
        className="hidden h-8 bg-gold text-gold-foreground hover:bg-gold/90 sm:inline-flex"
      >
        <UploadIcon data-icon="inline-start" />
        Carga de Dados
      </Button>
      <Button
        onClick={() => setUploadOpen(true)}
        size="icon"
        aria-label="Carga de Dados"
        className="bg-gold text-gold-foreground hover:bg-gold/90 sm:hidden"
      >
        <UploadIcon />
      </Button>

      <ThemeToggle />

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              variant="ghost"
              className="h-9 gap-2 px-1.5 text-header-foreground hover:bg-white/10 hover:text-header-foreground aria-expanded:bg-white/10"
              aria-label="Menu do usuário"
            />
          }
        >
          <Avatar size="sm">
            <AvatarFallback className="bg-white text-xs font-semibold text-[#0f2b5c]">
              {currentUser?.initials || '?'}
            </AvatarFallback>
          </Avatar>
          
          {currentUser ? (
            <span className="hidden text-left text-xs leading-tight md:block">
              <span className="block font-medium">{currentUser.name}</span>
              <span className="block opacity-80">{currentUser.role}</span>
            </span>
          ) : (
            <span className="hidden text-left text-xs leading-tight md:block">
              <span className="block font-medium">Visitante</span>
              <span className="block opacity-80">Não autenticado</span>
            </span>
          )}
          
          <ChevronDownIcon className="hidden opacity-70 md:block" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {currentUser ? (
            <>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex flex-col">
                  <span className="text-sm font-medium text-foreground">{currentUser.name}</span>
                  <span className="text-xs font-normal text-muted-foreground">{currentUser.email}</span>
                </DropdownMenuLabel>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => toast.info(`Usuário autenticado via API: ${currentUser.email} (${currentUser.role})`)}>
                  <UserIcon />
                  Informações da sessão
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast.info(`Backend API: http://localhost:8001/docs`)}>
                  <SettingsIcon />
                  Swagger / Docs API
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => {
                    clearStoredTokens()
                    toast.info('Sessão encerrada.')
                    window.location.href = '/login'
                  }}
                >
                  <LogOutIcon />
                  Encerrar sessão
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : (
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={() => window.location.href = '/login'}>
                <UserIcon />
                Fazer Login
              </DropdownMenuItem>
            </DropdownMenuGroup>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}