import { SEED_AD_USERS } from '../mock/seed.js'
import type { AdUser, AdUserInput } from '../types/index.js'

let adUsers: AdUser[] = SEED_AD_USERS.map((u) => ({
  ...u,
  groups: [...u.groups],
}))

function clone(user: AdUser): AdUser {
  return { ...user, groups: [...user.groups] }
}

export async function listAdUsers(): Promise<AdUser[]> {
  return adUsers.map(clone)
}

export async function createAdUser(input: AdUserInput): Promise<AdUser> {
  const usernameTaken = adUsers.some(
    (u) => u.username.toLowerCase() === input.username.toLowerCase(),
  )
  if (usernameTaken) {
    throw new Error('Ya existe un usuario con ese nombre')
  }

  const user: AdUser = {
    id: `ad-${Date.now()}`,
    ...input,
    groups: [...input.groups],
  }
  adUsers.push(user)
  return clone(user)
}

export async function updateAdUser(
  id: string,
  input: AdUserInput,
): Promise<AdUser | null> {
  const index = adUsers.findIndex((u) => u.id === id)
  if (index === -1) return null

  const usernameTaken = adUsers.some(
    (u) =>
      u.id !== id &&
      u.username.toLowerCase() === input.username.toLowerCase(),
  )
  if (usernameTaken) {
    throw new Error('Ya existe un usuario con ese nombre')
  }

  adUsers[index] = {
    id,
    ...input,
    groups: [...input.groups],
  }

  return clone(adUsers[index])
}

export async function deleteAdUser(id: string): Promise<boolean> {
  const before = adUsers.length
  adUsers = adUsers.filter((u) => u.id !== id)
  return adUsers.length < before
}
