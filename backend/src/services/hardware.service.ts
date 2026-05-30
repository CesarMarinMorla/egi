import type { IMachineRepository } from '../repositories/interfaces/IMachineRepository.js'
import type { IHardwareRepository } from '../repositories/interfaces/IHardwareRepository.js'
import type { User, Hardware, HardwareInput } from '../types/index.js'
import { can, canAccessLab } from '../lib/permissions.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors.js'

export interface HardwareService {
  getForMachine(user: User, machineId: number): Promise<Hardware>
  saveForMachine(user: User, machineId: number, input: HardwareInput): Promise<Hardware>
  deleteForMachine(user: User, machineId: number): Promise<void>
}

async function getAccessibleMachine(
  machineRepo: IMachineRepository,
  user: User,
  machineId: number,
) {
  const machine = await machineRepo.getById(machineId)
  if (!machine) throw new NotFoundError('Máquina no encontrada')
  if (!canAccessLab(user, machine.lab)) throw new ForbiddenError()
  return machine
}

export function createHardwareService(
  machineRepo: IMachineRepository,
  hardwareRepo: IHardwareRepository,
): HardwareService {
  return {
    async getForMachine(user, machineId) {
      await getAccessibleMachine(machineRepo, user, machineId)
      const hardware = await hardwareRepo.getByMachineId(machineId)
      if (!hardware) throw new NotFoundError('Hardware no encontrado')
      return hardware
    },

    async saveForMachine(user, machineId, input) {
      await getAccessibleMachine(machineRepo, user, machineId)
      const existing = await hardwareRepo.getByMachineId(machineId)
      const action = existing ? 'update' : 'create'
      if (!can(user, action, 'inventory')) throw new ForbiddenError()
      return hardwareRepo.save(machineId, input)
    },

    async deleteForMachine(user, machineId) {
      await getAccessibleMachine(machineRepo, user, machineId)
      const deleted = await hardwareRepo.delete(machineId)
      if (!deleted) throw new NotFoundError('Hardware no encontrado')
    },
  }
}
