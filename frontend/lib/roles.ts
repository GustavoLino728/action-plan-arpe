import type { UserSession } from '@/lib/api/client'

export type UserRole = 'admin' | 'diretor' | 'coordenador' | 'servidor'

function isOversight(user: UserSession | null | undefined): boolean {
  return user?.department?.is_oversight === true
}

export function canViewAllInitiatives(user: UserSession | null | undefined): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'diretor') return true
  return isOversight(user)
}

export function canManagePerspectives(user: UserSession | null | undefined): boolean {
  return canViewAllInitiatives(user)
}

export function canManageObjectives(user: UserSession | null | undefined): boolean {
  return canViewAllInitiatives(user)
}

export function canManageInitiatives(user: UserSession | null | undefined): boolean {
  return canViewAllInitiatives(user)
}

export function canImportSpreadsheet(user: UserSession | null | undefined): boolean {
  if (!user) return false
  if (user.role === 'admin' || user.role === 'diretor' || user.role === 'coordenador') return true
  return isOversight(user)
}

export function canManageUsers(user: UserSession | null | undefined): boolean {
  return user?.role === 'admin'
}

export function canManageDepartments(user: UserSession | null | undefined): boolean {
  return user?.role === 'admin'
}