import type { Hardware, HardwareInput, Machine, MachineInput } from '../types'
import {
  mockDeleteHardware,
  mockGetHardware,
  mockSaveHardware,
} from './mock/hardwareApi'
import {
  mockCreateMachine,
  mockDeleteMachine,
  mockGetMachine,
  mockGetMachines,
  mockUpdateMachine,
} from './mock/machineApi'

const useMock = import.meta.env.VITE_USE_MOCK !== 'false'

export async function getMachines(): Promise<Machine[]> {
  if (useMock) {
    return mockGetMachines()
  }

  const response = await fetch('/api/machines')
  if (!response.ok) {
    throw new Error('No se pudo cargar el inventario')
  }

  return response.json() as Promise<Machine[]>
}

export async function getMachine(id: number): Promise<Machine | null> {
  if (useMock) {
    return mockGetMachine(id)
  }

  const response = await fetch(`/api/machines/${id}`)
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error('No se pudo cargar la máquina')
  }

  return response.json() as Promise<Machine>
}

export async function createMachine(input: MachineInput): Promise<Machine> {
  if (useMock) {
    return mockCreateMachine(input)
  }

  const response = await fetch('/api/machines', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error('No se pudo crear la máquina')
  }

  return response.json() as Promise<Machine>
}

export async function updateMachine(
  id: number,
  input: MachineInput,
): Promise<Machine> {
  if (useMock) {
    const updated = await mockUpdateMachine(id, input)
    if (!updated) throw new Error('Máquina no encontrada')
    return updated
  }

  const response = await fetch(`/api/machines/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error('No se pudo actualizar la máquina')
  }

  return response.json() as Promise<Machine>
}

export async function deleteMachine(id: number): Promise<void> {
  if (useMock) {
    const deleted = await mockDeleteMachine(id)
    if (!deleted) throw new Error('Máquina no encontrada')
    await mockDeleteHardware(id)
    return
  }

  const response = await fetch(`/api/machines/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error('No se pudo eliminar la máquina')
  }
}

export async function getHardware(machineId: number): Promise<Hardware | null> {
  if (useMock) {
    return mockGetHardware(machineId)
  }

  const response = await fetch(`/api/hardware/${machineId}`)
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error('No se pudo cargar el hardware')
  }

  return response.json() as Promise<Hardware>
}

export async function saveHardware(
  machineId: number,
  input: HardwareInput,
): Promise<Hardware> {
  if (useMock) {
    return mockSaveHardware(machineId, input)
  }

  const response = await fetch(`/api/hardware/${machineId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error('No se pudo guardar el hardware')
  }

  return response.json() as Promise<Hardware>
}

export async function deleteHardware(machineId: number): Promise<void> {
  if (useMock) {
    const deleted = await mockDeleteHardware(machineId)
    if (!deleted) throw new Error('Hardware no encontrado')
    return
  }

  const response = await fetch(`/api/hardware/${machineId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error('No se pudo eliminar el hardware')
  }
}
