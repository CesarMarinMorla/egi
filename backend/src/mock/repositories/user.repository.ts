import { SEED_AD_USERS, AUTH_USERS } from '../seed.js'
import type { IUserRepository, IAuthRepository } from '../../repositories/interfaces/IUserRepository.js'
import type { AdUser, AdUserInput, User } from '../../types/index.js'

let adUsers: AdUser[] = SEED_AD_USERS.map((u) => ({
  ...u,
  groups: [...u.groups],
}))

export const mockUserRepository: IUserRepository = {
  async list() {
    return adUsers.map((u) => ({ ...u, groups: [...u.groups] }))
  },

  async getById(id) {
    const user = adUsers.find((u) => u.id === id)
    return user ? { ...user, groups: [...user.groups] } : null
  },

  async create(input) {
    const taken = adUsers.some(
      (u) => u.username.toLowerCase() === input.username.toLowerCase(),
    )
    if (taken) throw new Error('Ya existe un usuario con ese nombre')

    const user: AdUser = {
      id: `ad-${Date.now()}`,
      ...input,
      groups: [...input.groups],
    }
    adUsers.push(user)
    return { ...user, groups: [...user.groups] }
  },

  async update(id, input) {
    const index = adUsers.findIndex((u) => u.id === id)
    if (index === -1) return null

    const taken = adUsers.some(
      (u) =>
        u.id !== id &&
        u.username.toLowerCase() === input.username.toLowerCase(),
    )
    if (taken) throw new Error('Ya existe un usuario con ese nombre')

    adUsers[index] = { id, ...input, groups: [...input.groups] }
    return { ...adUsers[index], groups: [...adUsers[index].groups] }
  },

  async delete(id) {
    const before = adUsers.length
    adUsers = adUsers.filter((u) => u.id !== id)
    return adUsers.length < before
  },
}

export const mockAuthRepository: IAuthRepository = {
  async authenticate(username, password) {
    const user = AUTH_USERS.find(
      (u) =>
        u.username.toLowerCase() === String(username).trim().toLowerCase(),
    )
    if (!user) throw new Error('Usuario o contraseña incorrectos')
    return { ...user, labs: [...user.labs] }
  },
}
