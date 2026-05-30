import type { IUserRepository } from '../repositories/interfaces/IUserRepository.js'
import type { AdUser, AdUserInput } from '../types/index.js'
import { NotFoundError } from '../lib/errors.js'

export interface UsersService {
  list(): Promise<AdUser[]>
  create(input: AdUserInput): Promise<AdUser>
  update(id: string, input: AdUserInput): Promise<AdUser>
  delete(id: string): Promise<void>
}

export function createUsersService(userRepo: IUserRepository): UsersService {
  return {
    async list() {
      return userRepo.list()
    },

    async create(input) {
      return userRepo.create(input)
    },

    async update(id, input) {
      const updated = await userRepo.update(id, input)
      if (!updated) throw new NotFoundError('Usuario no encontrado')
      return updated
    },

    async delete(id) {
      const deleted = await userRepo.delete(id)
      if (!deleted) throw new NotFoundError('Usuario no encontrado')
    },
  }
}
