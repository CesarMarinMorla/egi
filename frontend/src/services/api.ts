import type { Machine } from '../types'
import { mockGetMachines } from './mock/machineApi'

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
