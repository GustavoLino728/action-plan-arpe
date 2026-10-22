'use client'

import { MoonIcon, SunIcon } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === 'dark'

  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            className="text-header-foreground hover:bg-white/10 hover:text-header-foreground"
            aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
            onClick={() => setTheme(isDark ? 'light' : 'dark')}
          />
        }
      >
        <SunIcon className="hidden dark:block" />
        <MoonIcon className="block dark:hidden" />
      </TooltipTrigger>
      <TooltipContent>{isDark ? 'Tema claro' : 'Tema escuro'}</TooltipContent>
    </Tooltip>
  )
}
