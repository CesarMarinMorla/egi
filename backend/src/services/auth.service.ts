import jwt from 'jsonwebtoken'
import config from '../config.js'
import type { IAuthRepository } from '../repositories/interfaces/IUserRepository.js'
import type { User } from '../types/index.js'

export interface AuthService {
  login(username: string, password: string): Promise<{ token: string; user: User }>
}

export function createAuthService(authRepo: IAuthRepository): AuthService {
  return {
    async login(username, password) {
      const user = await authRepo.authenticate(username, password)
      const token = jwt.sign({ user }, config.jwtSecret, { expiresIn: '8h' })
      return { token, user }
    },
  }
}
