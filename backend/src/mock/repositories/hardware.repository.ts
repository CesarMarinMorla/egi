import { SEED_HARDWARE } from '../seed.js'
import type { IHardwareRepository } from '../../repositories/interfaces/IHardwareRepository.js'
import type { Hardware, HardwareInput } from '../../types/index.js'

let items: Hardware[] = SEED_HARDWARE.map((h) => ({ ...h }))

export const mockHardwareRepository: IHardwareRepository = {
  async getByMachineId(machineId) {
    const hardware = items.find((h) => h.machineId === machineId)
    return hardware ? { ...hardware } : null
  },

  async save(machineId, input) {
    const index = items.findIndex((h) => h.machineId === machineId)
    const hardware: Hardware = { machineId, ...input }

    if (index === -1) {
      items.push(hardware)
    } else {
      items[index] = hardware
    }

    return { ...hardware }
  },

  async delete(machineId) {
    const before = items.length
    items = items.filter((h) => h.machineId !== machineId)
    return items.length < before
  },
}
