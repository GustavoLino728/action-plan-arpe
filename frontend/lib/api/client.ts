export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'localhost'
    ? 'http://localhost:8001'
    : 'http://localhost:8001')

const TOKEN_KEY = 'arpe_auth_token'
const REFRESH_TOKEN_KEY = 'arpe_refresh_token'
const COOKIE_NAME = 'arpe_session'


export interface UserSession {
  id: string
  name: string
  email: string
  role: string
  roleLabel: string
  department: string | null
  initials: string
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setStoredTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(TOKEN_KEY, accessToken)
  if (refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  document.cookie = `${COOKIE_NAME}=1; path=/; max-age=${60 * 60 * 8}; SameSite=Lax`
}

export function clearStoredTokens(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`
}

export function getInitials(name: string): string {
  if (!name) return 'AR'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}))
    throw new Error(errorData.detail || `Falha no login (${res.status})`)
  }

  const data = await res.json()
  setStoredTokens(data.access_token, data.refresh_token)
  return data
}

export async function apiFetch<T = unknown>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken()
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  
  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    clearStoredTokens()
    if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
      window.location.href = '/login'
    }
    throw new Error('Sessão expirada. Faça login novamente.')
  }

  if (!res.ok) {
    const errJson = await res.json().catch(() => null)
    const message = errJson?.detail || `Erro na requisição ${endpoint}: status ${res.status}`
    throw new Error(typeof message === 'string' ? message : JSON.stringify(message))
  }

  if (res.status === 204) return null as T
  return res.json()
}

export async function getMe(): Promise<UserSession> {
  const data = await apiFetch<any>('/api/v1/auth/me')
  return {
    id: data.id,
    name: data.name,
    email: data.email,
    role: data.role,
    roleLabel:
      data.role === 'admin'
        ? 'Administrador'
        : data.role === 'coordenador'
          ? 'Coordenador'
          : 'Servidor',
    department: data.department || 'ARPE',
    initials: getInitials(data.name),
  }
}