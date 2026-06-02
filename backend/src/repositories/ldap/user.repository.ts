import type { IUserRepository } from "../interfaces/IUserRepository.js";
import type { ILdapClient } from "../../db/ldapClient.js";
import type { AdUser, AdUserInput } from "../../types/index.js";

export function createLdapUserRepository(client: ILdapClient): IUserRepository {
	return {
		async list(): Promise<AdUser[]> {
			return await client.listUsers();
		},

		async getById(id: string): Promise<AdUser | null> {
			return await client.getUserById(id);
		},

		async create(input: AdUserInput): Promise<AdUser> {
			return await client.createUser(input);
		},

		async update(id: string, input: AdUserInput): Promise<AdUser | null> {
			return await client.updateUser(id, input);
		},

		async delete(id: string): Promise<boolean> {
			return await client.deleteUser(id);
		},
	};
}
