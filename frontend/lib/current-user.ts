export interface CurrentUserInfo {
  id?: string
  name: string
  initials: string
  role: string
  email: string
  department?: string | null
}

export const DEFAULT_USER: CurrentUserInfo = {
  name: 'Administrador ARPE',
  initials: 'AD',
  role: 'Administrador',
  email: 'admin@arpe.pe.gov.br',
  department: 'CTI',
}

export const CURRENT_USER = DEFAULT_USER