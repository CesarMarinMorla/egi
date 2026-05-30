import type { Hardware, HardwareInput } from '../../types'
import { MOCK_HARDWARE } from './hardware'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let hardwareItems: Hardware[] = MOCK_HARDWARE.map((item) => ({ ...item }))

export async function mockGetHardware(
  machineId: number,
): Promise<Hardware | null> {
  await delay(200)
  const hardware = hardwareItems.find((item) => item.machineId === machineId)
  return hardware ? { ...hardware } : null
}

export async function mockSaveHardware(
  machineId: number,
  input: HardwareInput,
): Promise<Hardware> {
  await delay(250)
  const index = hardwareItems.findIndex((item) => item.machineId === machineId)
  const hardware: Hardware = { machineId, ...input }

  if (index === -1) {
    hardwareItems.push(hardware)
  } else {
    hardwareItems[index] = hardware
  }

  return { ...hardware }
}

export async function mockDeleteHardware(machineId: number): Promise<boolean> {
  await delay(250)
  const before = hardwareItems.length
  hardwareItems = hardwareItems.filter((item) => item.machineId !== machineId)
  return hardwareItems.length < before
}
