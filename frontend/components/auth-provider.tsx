'use client'

import * as React from 'react'
import {
  getMe,
  login as apiLogin,
  clearStoredTokens,
  type UserSession,
} from '@/lib/api/client'

interface AuthContextType {
  user: UserSession | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<UserSession | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)

  React.useEffect(() => {
    let cancelled = false
    const bootstrap = async () => {
      try {
        const me = await getMe()
        if (!cancelled) setUser(me)
      } catch {
        if (!cancelled) setUser(null)
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }
    void bootstrap()
    return () => { cancelled = true }
  }, [])

  const login = React.useCallback(async (email: string, password: string) => {
    await apiLogin(email, password)
    const me = await getMe()
    setUser(me)
  }, [])

  const logout = React.useCallback(() => {
    clearStoredTokens()
    setUser(null)
  }, [])

  const value = React.useMemo<AuthContextType>(
    () => ({ user, isLoading, isAuthenticated: !!user, login, logout }),
    [user, isLoading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth deve ser usado dentro de <AuthProvider>')
  return ctx
}