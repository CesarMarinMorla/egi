import { SEED_MACHINES } from '../mock/seed.js'
import type { Machine, MachineInput } from '../types/index.js'

let machines: Machine[] = SEED_MACHINES.map((m) => ({ ...m }))

function clone(machine: Machine): Machine {
  return { ...machine }
}

export async function listMachines(): Promise<Machine[]> {
  return machines.map(clone)
}

export async function getMachine(id: number): Promise<Machine | null> {
  const machine = machines.find((m) => m.id === id)
  return machine ? clone(machine) : null
}

export async function createMachine(input: MachineInput): Promise<Machine> {
  const id = machines.reduce((max, m) => Math.max(max, m.id), 0) + 1
  const machine: Machine = { id, ...input }
  machines.push(machine)
  return clone(machine)
}

export async function updateMachine(
  id: number,
  input: Partial<MachineInput>,
): Promise<Machine | null> {
  const index = machines.findIndex((m) => m.id === id)
  if (index === -1) return null

  machines[index] = { ...machines[index], ...input, id }
  return clone(machines[index])
}

export async function deleteMachine(id: number): Promise<boolean> {
  const before = machines.length
  machines = machines.filter((m) => m.id !== id)
  return machines.length < before
}
