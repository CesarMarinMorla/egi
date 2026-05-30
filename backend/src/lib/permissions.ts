import type { User, UserRole } from '../types/index.js'

const ROLE_LEVEL: Record<UserRole, number> = {
  readonly: 0,
  operator: 1,
  editor: 2,
  manager: 3,
  sysadmin: 4,
}

type Resource = 'inventory' | 'users'
type Action = 'read' | 'create' | 'update' | 'delete'

export function can(
  user: User | undefined | null,
  action: Action,
  resource: Resource,
): boolean {
  if (!user) return false

  if (resource === 'users') {
    if (action === 'read') return ROLE_LEVEL[user.role] >= 3
    return user.role === 'sysadmin'
  }

  switch (action) {
    case 'read':
      return true
    case 'create':
      return ROLE_LEVEL[user.role] >= 2
    case 'update':
      return ROLE_LEVEL[user.role] >= 1
    case 'delete':
      return ROLE_LEVEL[user.role] >= 3
    default:
      return false
  }
}

export function canAccessLab(user: User | undefined | null, lab: string): boolean {
  if (!user) return false
  if (user.role === 'sysadmin' || user.role === 'manager') return true
  return user.labs.includes(lab)
}
