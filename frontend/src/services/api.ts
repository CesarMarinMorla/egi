import type { Hardware, Machine } from '../types'
import { mockGetHardware } from './mock/hardwareApi'
import { mockGetMachine, mockGetMachines } from './mock/machineApi'

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
