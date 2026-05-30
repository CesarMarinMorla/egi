import type { Hardware } from '../../types'
import { MOCK_HARDWARE } from './hardware'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockGetHardware(
  machineId: number,
): Promise<Hardware | null> {
  await delay(200)
  return MOCK_HARDWARE.find((item) => item.machineId === machineId) ?? null
}
