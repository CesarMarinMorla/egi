import type {
  AdUser,
  AdUserInput,
  AuthSession,
  Hardware,
  HardwareInput,
  Machine,
  MachineInput,
} from '../types'
import { apiFetch, readApiError } from './http'
import { mockLogin } from './mock/auth'
import {
  mockCreateAdUser,
  mockDeleteAdUser,
  mockGetAdUsers,
  mockUpdateAdUser,
} from './mock/adUserApi'
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

export async function login(
  username: string,
  password: string,
): Promise<AuthSession> {
  if (useMock) {
    return mockLogin(username, password)
  }

  const response = await fetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'Error al iniciar sesión'))
  }

  return response.json() as Promise<AuthSession>
}

export async function getMachines(): Promise<Machine[]> {
  if (useMock) {
    return mockGetMachines()
  }

  const response = await apiFetch('/api/machines')
  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo cargar el inventario'))
  }

  return response.json() as Promise<Machine[]>
}

export async function getMachine(id: number): Promise<Machine | null> {
  if (useMock) {
    return mockGetMachine(id)
  }

  const response = await apiFetch(`/api/machines/${id}`)
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo cargar la máquina'))
  }

  return response.json() as Promise<Machine>
}

export async function createMachine(input: MachineInput): Promise<Machine> {
  if (useMock) {
    return mockCreateMachine(input)
  }

  const response = await apiFetch('/api/machines', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo crear la máquina'))
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

  const response = await apiFetch(`/api/machines/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(
      await readApiError(response, 'No se pudo actualizar la máquina'),
    )
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

  const response = await apiFetch(`/api/machines/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo eliminar la máquina'))
  }
}

export async function getHardware(machineId: number): Promise<Hardware | null> {
  if (useMock) {
    return mockGetHardware(machineId)
  }

  const response = await apiFetch(`/api/hardware/${machineId}`)
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo cargar el hardware'))
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

  const response = await apiFetch(`/api/hardware/${machineId}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo guardar el hardware'))
  }

  return response.json() as Promise<Hardware>
}

export async function deleteHardware(machineId: number): Promise<void> {
  if (useMock) {
    const deleted = await mockDeleteHardware(machineId)
    if (!deleted) throw new Error('Hardware no encontrado')
    return
  }

  const response = await apiFetch(`/api/hardware/${machineId}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo eliminar el hardware'))
  }
}

export async function getAdUsers(): Promise<AdUser[]> {
  if (useMock) {
    return mockGetAdUsers()
  }

  const response = await apiFetch('/api/users')
  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo cargar usuarios AD'))
  }

  return response.json() as Promise<AdUser[]>
}

export async function createAdUser(input: AdUserInput): Promise<AdUser> {
  if (useMock) {
    return mockCreateAdUser(input)
  }

  const response = await apiFetch('/api/users', {
    method: 'POST',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo crear el usuario'))
  }

  return response.json() as Promise<AdUser>
}

export async function updateAdUser(
  id: string,
  input: AdUserInput,
): Promise<AdUser> {
  if (useMock) {
    const updated = await mockUpdateAdUser(id, input)
    if (!updated) throw new Error('Usuario no encontrado')
    return updated
  }

  const response = await apiFetch(`/api/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(input),
  })

  if (!response.ok) {
    throw new Error(
      await readApiError(response, 'No se pudo actualizar el usuario'),
    )
  }

  return response.json() as Promise<AdUser>
}

export async function deleteAdUser(id: string): Promise<void> {
  if (useMock) {
    const deleted = await mockDeleteAdUser(id)
    if (!deleted) throw new Error('Usuario no encontrado')
    return
  }

  const response = await apiFetch(`/api/users/${id}`, { method: 'DELETE' })
  if (!response.ok) {
    throw new Error(await readApiError(response, 'No se pudo eliminar el usuario'))
  }
}
