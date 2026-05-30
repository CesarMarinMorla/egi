import type { Machine, MachineInput } from '../../types'
import { MOCK_MACHINES } from './machines'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let machines: Machine[] = MOCK_MACHINES.map((machine) => ({ ...machine }))

export async function mockGetMachines(): Promise<Machine[]> {
  await delay(300)
  return machines.map((machine) => ({ ...machine }))
}

export async function mockGetMachine(id: number): Promise<Machine | null> {
  await delay(200)
  const machine = machines.find((item) => item.id === id)
  return machine ? { ...machine } : null
}

export async function mockCreateMachine(input: MachineInput): Promise<Machine> {
  await delay(250)
  const id = machines.reduce((max, item) => Math.max(max, item.id), 0) + 1
  const machine: Machine = { id, ...input }
  machines.push(machine)
  return { ...machine }
}

export async function mockUpdateMachine(
  id: number,
  input: MachineInput,
): Promise<Machine | null> {
  await delay(250)
  const index = machines.findIndex((item) => item.id === id)
  if (index === -1) return null

  machines[index] = { id, ...input }
  return { ...machines[index] }
}

export async function mockDeleteMachine(id: number): Promise<boolean> {
  await delay(250)
  const before = machines.length
  machines = machines.filter((item) => item.id !== id)
  return machines.length < before
}