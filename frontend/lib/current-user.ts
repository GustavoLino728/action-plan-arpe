export interface CurrentUserInfo {
  id?: string
  name: string
  initials: string
  role: string
  email: string
  department?: string | null
}