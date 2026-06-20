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

export type MachineInput = Omit<Machine, 'id'>
export type HardwareInput = Omit<Hardware, 'machineId'>

export const ALL_LABS = ['Lab 101', 'Lab 102', 'Lab 201'] as const

export const AD_GROUPS = [
  'GRP_Sysadmin',
  'GRP_Manager',
  'GRP_Editor_Lab101',
  'GRP_Editor_Lab102',
  'GRP_Editor_Lab201',
  'GRP_Operator_Lab101',
  'GRP_Operator_Lab102',
  'GRP_Operator_Lab201',
  'GRP_ReadOnly_Lab101',
  'GRP_ReadOnly_Lab102',
  'GRP_ReadOnly_Lab201',
] as const

export type AdGroup = (typeof AD_GROUPS)[number]

export interface AdUser {
  id: string
  username: string
  displayName: string
  email: string
  groups: AdGroup[]
  enabled: boolean
}

export type AdUserInput = Omit<AdUser, 'id'>
