import type { IMachineRepository } from '../interfaces/IMachineRepository.js'
import type { ISqlClient } from '../../db/sqlClient.js'
import type { Machine, MachineInput } from '../../types/index.js'

export function createSqlMachineRepository(client: ISqlClient): IMachineRepository {
  return {
    async list() {
      return client.listMachines()
    },

    async getById(id) {
      return client.getMachine(id)
    },

    async create(input) {
      return client.createMachine(input)
    },

    async update(id, input) {
      return client.updateMachine(id, input)
    },

    async delete(id) {
      return client.deleteMachine(id)
    },
  }
}
