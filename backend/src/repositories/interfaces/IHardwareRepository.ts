import type { Hardware, HardwareInput } from '../../types/index.js'

export interface IHardwareRepository {
  getByMachineId(machineId: number): Promise<Hardware | null>
  save(machineId: number, input: HardwareInput): Promise<Hardware>
  delete(machineId: number): Promise<boolean>
}
