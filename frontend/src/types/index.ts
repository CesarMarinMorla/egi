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

export type MachineStatus = 'active' | 'maintenance' | 'retired'

export type AssigneeType = 'student' | 'teacher' | 'technician'

export interface Machine {
  id: number
  hostname: string
  lab: string
  benchNumber: number
  maintenanceDate: string
  status: MachineStatus
  assignee?: string
  assigneeType?: AssigneeType
}
