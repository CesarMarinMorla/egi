import { SEED_MACHINES } from '../seed.js'
import type { IMachineRepository } from '../../repositories/interfaces/IMachineRepository.js'
import type { Machine, MachineInput } from '../../types/index.js'

let machines: Machine[] = SEED_MACHINES.map((m) => ({ ...m }))

export const mockMachineRepository: IMachineRepository = {
  async list() {
    return machines.map((m) => ({ ...m }))
  },

  async getById(id) {
    const machine = machines.find((m) => m.id === id)
    return machine ? { ...machine } : null
  },

  async create(input) {
    const id = machines.reduce((max, m) => Math.max(max, m.id), 0) + 1
    const machine: Machine = { id, ...input }
    machines.push(machine)
    return { ...machine }
  },

  async update(id, input) {
    const index = machines.findIndex((m) => m.id === id)
    if (index === -1) return null
    machines[index] = { ...machines[index], ...input, id }
    return { ...machines[index] }
  },

  async delete(id) {
    const before = machines.length
    machines = machines.filter((m) => m.id !== id)
    return machines.length < before
  },
}
