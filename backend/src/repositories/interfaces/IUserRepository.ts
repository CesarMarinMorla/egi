import type { AdUser, AdUserInput, User } from '../../types/index.js'

export interface IUserRepository {
  list(): Promise<AdUser[]>
  getById(id: string): Promise<AdUser | null>
  create(input: AdUserInput): Promise<AdUser>
  update(id: string, input: AdUserInput): Promise<AdUser | null>
  delete(id: string): Promise<boolean>
}

export interface IAuthRepository {
  authenticate(username: string, password: string): Promise<User>
}
