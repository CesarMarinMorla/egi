import { SEED_HARDWARE } from '../mock/seed.js'
import type { Hardware, HardwareInput } from '../types/index.js'

let hardwareItems: Hardware[] = SEED_HARDWARE.map((h) => ({ ...h }))

function clone(hardware: Hardware): Hardware {
  return { ...hardware }
}

export async function getHardware(
  machineId: number,
): Promise<Hardware | null> {
  const hardware = hardwareItems.find((h) => h.machineId === machineId)
  return hardware ? clone(hardware) : null
}

export async function saveHardware(
  machineId: number,
  input: HardwareInput,
): Promise<Hardware> {
  const index = hardwareItems.findIndex((h) => h.machineId === machineId)
  const hardware: Hardware = { machineId, ...input }

  if (index === -1) {
    hardwareItems.push(hardware)
  } else {
    hardwareItems[index] = hardware
  }

  return clone(hardware)
}

export async function deleteHardware(machineId: number): Promise<boolean> {
  const before = hardwareItems.length
  hardwareItems = hardwareItems.filter((h) => h.machineId !== machineId)
  return hardwareItems.length < before
}
