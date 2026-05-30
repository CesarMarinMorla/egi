import { SEED_AD_USERS } from '../mock/seed.js'

let adUsers = SEED_AD_USERS.map((user) => ({
  ...user,
  groups: [...user.groups],
}))

function clone(user) {
  return { ...user, groups: [...user.groups] }
}

export async function listAdUsers() {
  return adUsers.map(clone)
}

export async function createAdUser(input) {
  const usernameTaken = adUsers.some(
    (user) => user.username.toLowerCase() === input.username.toLowerCase(),
  )
  if (usernameTaken) {
    throw new Error('Ya existe un usuario con ese nombre')
  }

  const user = {
    id: `ad-${Date.now()}`,
    ...input,
    groups: [...input.groups],
  }
  adUsers.push(user)
  return clone(user)
}

export async function updateAdUser(id, input) {
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

  return clone(adUsers[index])
}

export async function deleteAdUser(id) {
  const before = adUsers.length
  adUsers = adUsers.filter((user) => user.id !== id)
  return adUsers.length < before
}
