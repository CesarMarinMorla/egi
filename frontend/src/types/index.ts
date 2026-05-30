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

export type HardwareType = 'desktop' | 'laptop'

export interface Hardware {
  machineId: number
  type: HardwareType
  manufacturer: string
  model: string
  cpu: string
  ramGb: number
  diskGb: number
  os: string
  monitor: string
  mouse: string
  keyboard: string
}
