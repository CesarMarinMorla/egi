import type { User } from '../types/index.js'

export interface ILdapClient {
  authenticate(username: string, password: string): Promise<User>
}

export async function createLdapClient(): Promise<ILdapClient> {
  // const client = await LdapClient.bind(process.env.LDAP_URL)
  // return { ... }

  throw new Error('LDAP no configurado. Usar mock mode.')
}
