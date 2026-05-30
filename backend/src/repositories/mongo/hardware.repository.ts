import type { IHardwareRepository } from '../interfaces/IHardwareRepository.js'
import type { IMongoClient } from '../../db/mongoClient.js'
import type { Hardware, HardwareInput } from '../../types/index.js'

export function createMongoHardwareRepository(
  client: IMongoClient,
): IHardwareRepository {
  return {
    async getByMachineId(machineId) {
      return client.getHardware(machineId)
    },

    async save(machineId, input) {
      return client.saveHardware(machineId, input)
    },

    async delete(machineId) {
      return client.deleteHardware(machineId)
    },
  }
}
