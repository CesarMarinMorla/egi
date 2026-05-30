import type { Machine } from '../../types'
import { MOCK_MACHINES } from './machines'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function mockGetMachines(): Promise<Machine[]> {
  await delay(300)
  return [...MOCK_MACHINES]
}

export async function mockGetMachine(id: number): Promise<Machine | null> {
  await delay(200)
  return MOCK_MACHINES.find((machine) => machine.id === id) ?? null
}
