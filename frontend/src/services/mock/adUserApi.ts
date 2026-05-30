import type { AdUser, AdUserInput } from '../../types'
import { MOCK_AD_USERS } from './adUsers'

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

let adUsers: AdUser[] = MOCK_AD_USERS.map((user) => ({ ...user }))

export async function mockGetAdUsers(): Promise<AdUser[]> {
  await delay(300)
  return adUsers.map((user) => ({ ...user, groups: [...user.groups] }))
}

export async function mockCreateAdUser(input: AdUserInput): Promise<AdUser> {
  await delay(250)

  const usernameTaken = adUsers.some(
    (user) => user.username.toLowerCase() === input.username.toLowerCase(),
  )
  if (usernameTaken) {
    throw new Error('Ya existe un usuario con ese nombre')
  }

  const id = `ad-${Date.now()}`
  const user: AdUser = {
    id,
    ...input,
    groups: [...input.groups],
  }
  adUsers.push(user)
  return { ...user, groups: [...user.groups] }
}

export async function mockUpdateAdUser(
  id: string,
  input: AdUserInput,
): Promise<AdUser | null> {
  await delay(250)

  const index = adUsers.findIndex((user) => user.id === id)
  if (index === -1) return null

  const usernameTaken = adUsers.some(
    (user) =>
      user.id !== id &&
      user.username.toLowerCase() === input.username.toLowerCase(),
  )
  if (usernameTaken) {
    throw new Error('Ya existe un usuario con ese nombre')
  }

  adUsers[index] = {
    id,
    ...input,
    groups: [...input.groups],
  }

  return { ...adUsers[index], groups: [...adUsers[index].groups] }
}

export async function mockDeleteAdUser(id: string): Promise<boolean> {
  await delay(250)
  const before = adUsers.length
  adUsers = adUsers.filter((user) => user.id !== id)
  return adUsers.length < before
}
