export type Role =
  | 'sysadmin'
  | 'manager'
  | 'editor'
  | 'operator'
  | 'readonly'

export interface User {
  id: string
  username: string
  displayName: string
  role: Role
  labs: string[]
}

export interface AuthSession {
  token: string
  user: User
}
