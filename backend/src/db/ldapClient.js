import config from '../config.js'
import { AUTH_USERS } from '../mock/seed.js'

export async function authenticate(username, password) {
  if (config.mockMode) {
    const user = AUTH_USERS.find(
      (item) => item.username.toLowerCase() === String(username).trim().toLowerCase(),
    )

    if (!user) {
      throw new Error('Usuario o contraseña incorrectos')
    }

    return { ...user, labs: [...user.labs] }
  }

  throw new Error('LDAP real no configurado')
}
