import type { Machine, MachineInput } from '../../types/index.js'

export interface IMachineRepository {
  list(): Promise<Machine[]>
  getById(id: number): Promise<Machine | null>
  create(input: MachineInput): Promise<Machine>
  update(id: number, input: Partial<MachineInput>): Promise<Machine | null>
  delete(id: number): Promise<boolean>
}
