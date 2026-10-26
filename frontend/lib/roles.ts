export type Role = 'admin' | 'coordenador' | 'servidor' | string

export function podeVerCarga(role?: string | null): boolean {
  return role === 'admin' || role === 'coordenador'
}

export function podeVerUsuarios(role?: string | null): boolean {
  return role === 'admin' || role === 'coordenador'
}