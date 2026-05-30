import type { Machine, MachineInput } from '../types/index.js'

export interface ISqlClient {
  listMachines(): Promise<Machine[]>
  getMachine(id: number): Promise<Machine | null>
  createMachine(input: MachineInput): Promise<Machine>
  updateMachine(id: number, input: Partial<MachineInput>): Promise<Machine | null>
  deleteMachine(id: number): Promise<boolean>
}

export async function createSqlClient(): Promise<ISqlClient> {
  // const pool = await sql.connect(process.env.SQL_CONNECTION_STRING)
  // return { ... }

  throw new Error('SQL Server no configurado. Usar mock mode.')
}
