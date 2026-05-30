import type { IUserRepository } from '../interfaces/IUserRepository.js'
import type { ILdapClient } from '../../db/ldapClient.js'
import type { AdUser, AdUserInput } from '../../types/index.js'

export function createLdapUserRepository(
  _client: ILdapClient,
): IUserRepository {
  return {
    async list(): Promise<AdUser[]> {
      // const entries = await client.search('ou=Users,dc=itu,dc=local', ...)
      throw new Error('LDAP real no implementado')
    },

    async getById(_id: string): Promise<AdUser | null> {
      throw new Error('LDAP real no implementado')
    },

    async create(_input: AdUserInput): Promise<AdUser> {
      throw new Error('LDAP real no implementado')
    },

    async update(_id: string, _input: AdUserInput): Promise<AdUser | null> {
      throw new Error('LDAP real no implementado')
    },

    async delete(_id: string): Promise<boolean> {
      throw new Error('LDAP real no implementado')
    },
  }
}
