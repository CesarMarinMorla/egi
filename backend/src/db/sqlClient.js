import { SEED_MACHINES } from '../mock/seed.js'

let machines = SEED_MACHINES.map((machine) => ({ ...machine }))

function clone(machine) {
  return { ...machine }
}

export async function listMachines() {
  return machines.map(clone)
}

export async function getMachine(id) {
  const machine = machines.find((item) => item.id === id)
  return machine ? clone(machine) : null
}

export async function createMachine(input) {
  const id = machines.reduce((max, item) => Math.max(max, item.id), 0) + 1
  const machine = { id, ...input }
  machines.push(machine)
  return clone(machine)
}

export async function updateMachine(id, input) {
  const index = machines.findIndex((item) => item.id === id)
  if (index === -1) return null

  machines[index] = { id, ...input }
  return clone(machines[index])
}

export async function deleteMachine(id) {
  const before = machines.length
  machines = machines.filter((item) => item.id !== id)
  return machines.length < before
}
