import config from '../config.js'
import { AUTH_USERS } from '../mock/seed.js'
import type { User } from '../types/index.js'

export async function authenticate(
  username: string,
  password: string,
): Promise<User> {
  if (config.mockMode) {
    const user = AUTH_USERS.find(
      (u) =>
        u.username.toLowerCase() === String(username).trim().toLowerCase(),
    )

    if (!user) {
      throw new Error('Usuario o contraseña incorrectos')
    }

    return { ...user, labs: [...user.labs] }
  }

  throw new Error('LDAP real no configurado')
}
