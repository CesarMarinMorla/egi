import type { IMachineRepository } from '../repositories/interfaces/IMachineRepository.js'
import type { IHardwareRepository } from '../repositories/interfaces/IHardwareRepository.js'
import type { User, Machine, MachineInput } from '../types/index.js'
import { canAccessLab } from '../lib/permissions.js'
import { ForbiddenError, NotFoundError, ValidationError } from '../lib/errors.js'

export interface MachinesService {
  listScoped(user: User): Promise<Machine[]>
  getByIdScoped(user: User, id: number): Promise<Machine>
  create(user: User, input: MachineInput): Promise<Machine>
  update(user: User, id: number, input: Partial<MachineInput>): Promise<Machine>
  delete(user: User, id: number): Promise<void>
}

export function createMachinesService(
  machineRepo: IMachineRepository,
  hardwareRepo: IHardwareRepository,
): MachinesService {
  return {
    async listScoped(user) {
      const machines = await machineRepo.list()
      return machines.filter((m) => canAccessLab(user, m.lab))
    },

    async getByIdScoped(user, id) {
      const machine = await machineRepo.getById(id)
      if (!machine) throw new NotFoundError('Máquina no encontrada')
      if (!canAccessLab(user, machine.lab)) throw new ForbiddenError()
      return machine
    },

    async create(user, input) {
      if (!input.hostname || !input.lab) {
        throw new ValidationError('hostname y lab son requeridos')
      }
      if (!canAccessLab(user, input.lab)) {
        throw new ForbiddenError('Sin permiso para crear en ese laboratorio')
      }
      return machineRepo.create(input)
    },

    async update(user, id, input) {
      const existing = await machineRepo.getById(id)
      if (!existing) throw new NotFoundError('Máquina no encontrada')
      if (!canAccessLab(user, existing.lab)) throw new ForbiddenError()
      if (input.lab && !canAccessLab(user, input.lab)) {
        throw new ForbiddenError('Sin permiso para asignar ese laboratorio')
      }
      const updated = await machineRepo.update(id, input)
      if (!updated) throw new NotFoundError()
      return updated
    },

    async delete(user, id) {
      const existing = await machineRepo.getById(id)
      if (!existing) throw new NotFoundError('Máquina no encontrada')
      if (!canAccessLab(user, existing.lab)) throw new ForbiddenError()

      await machineRepo.delete(id)
      await hardwareRepo.delete(id)
    },
  }
}
