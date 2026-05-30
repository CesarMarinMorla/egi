import { SEED_HARDWARE } from '../mock/seed.js'

let hardwareItems = SEED_HARDWARE.map((item) => ({ ...item }))

function clone(hardware) {
  return { ...hardware }
}

export async function getHardware(machineId) {
  const hardware = hardwareItems.find((item) => item.machineId === machineId)
  return hardware ? clone(hardware) : null
}

export async function saveHardware(machineId, input) {
  const index = hardwareItems.findIndex((item) => item.machineId === machineId)
  const hardware = { machineId, ...input }

  if (index === -1) {
    hardwareItems.push(hardware)
  } else {
    hardwareItems[index] = hardware
  }

  return clone(hardware)
}

export async function deleteHardware(machineId) {
  const before = hardwareItems.length
  hardwareItems = hardwareItems.filter((item) => item.machineId !== machineId)
  return hardwareItems.length < before
}
