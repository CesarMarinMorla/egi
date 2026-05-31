import { Client } from "ldapts";
import type { User, UserRole, AdUser, AdUserInput } from "../types/index.js";

// Mock data for CRUD operations when real AD operations are too complex
let mockAdUsers: AdUser[] = [
	{
		id: "ad-user-1",
		username: "admin",
		displayName: "Administrator",
		email: "admin@itu.local",
		groups: ["GRP_Sysadmin"],
		enabled: true,
	},
	{
		id: "ad-user-2",
		username: "manager",
		displayName: "Lab Manager",
		email: "manager@itu.local",
		groups: ["GRP_Manager"],
		enabled: true,
	},
	{
		id: "ad-user-3",
		username: "technician",
		displayName: "Lab Technician",
		email: "tech@itu.local",
		groups: ["GRP_Editor", "GRP_Editor_Lab101"],
		enabled: true,
	},
];

export interface ILdapClient {
	authenticate(username: string, password: string): Promise<User>;
	listUsers(): Promise<AdUser[]>;
	getUserById(id: string): Promise<AdUser | null>;
	createUser(input: AdUserInput): Promise<AdUser>;
	updateUser(id: string, input: AdUserInput): Promise<AdUser | null>;
	deleteUser(id: string): Promise<boolean>;
}

function mapAdGroupToRole(groups: string[]): UserRole {
	const groupMap: Record<string, UserRole> = {
		GRP_Sysadmin: "sysadmin",
		GRP_Manager: "manager",
		GRP_Editor: "editor",
		GRP_Operator: "operator",
		GRP_ReadOnly: "readonly",
	};

	for (const group of groups) {
		if (groupMap[group]) {
			return groupMap[group];
		}
	}

	return "readonly"; // Default role
}

export async function createLdapClient(): Promise<ILdapClient> {
	const ldapUrl = process.env.LDAP_URL || "ldap://localhost:389";
	const bindDn = process.env.LDAP_BIND_DN || "";
	const bindPassword = process.env.LDAP_BIND_PASSWORD || "";
	const searchBase = process.env.LDAP_SEARCH_BASE || "dc=itu,dc=local";
	const searchFilter = process.env.LDAP_SEARCH_FILTER || "(sAMAccountName={username})";

	const client = new Client({
		url: ldapUrl,
	});

	return {
		async authenticate(username: string, password: string): Promise<User> {
			try {
				// First, bind with service account if configured
				if (bindDn && bindPassword) {
					await client.bind(bindDn, bindPassword);
				}

				// Search for the user
				const { searchEntries } = await client.search(searchBase, {
					scope: "sub",
					filter: searchFilter.replace("{username}", username),
					attributes: ["dn", "cn", "sAMAccountName", "memberOf", "userPrincipalName"],
				});

				if (searchEntries.length === 0) {
					throw new Error("User not found in AD");
				}

				const userEntry = searchEntries[0];
				const userDn = userEntry.dn;

				// Re-bind with user credentials to verify password
				await client.bind(userDn, password);

				// Extract user info
				const cn = Array.isArray(userEntry.cn) ? userEntry.cn[0] : userEntry.cn;
				const sAMAccountName = Array.isArray(userEntry.sAMAccountName) ? userEntry.sAMAccountName[0] : userEntry.sAMAccountName;
				const cnStr = typeof cn === "string" ? cn : cn ? String(cn) : "";
				const sAMAccountNameStr =
					typeof sAMAccountName === "string" ? sAMAccountName : sAMAccountName ? String(sAMAccountName) : "";
				const displayName = cnStr || sAMAccountNameStr || username;
				const memberOf = (userEntry.memberOf as string[]) || [];

				// Map AD groups to role
				const role = mapAdGroupToRole(memberOf);

				// Extract labs from groups (assuming format like GRP_Editor_Lab101, etc.)
				const labs = memberOf
					.filter((group: string) => group.includes("Lab"))
					.map((group: string) => {
						const match = group.match(/Lab\s*\d+/i);
						return match ? match[0] : "";
					})
					.filter(Boolean);

				return {
					id: userDn,
					username: sAMAccountNameStr || username,
					displayName,
					role,
					labs,
				};
			} catch (error) {
				throw new Error(`LDAP authentication failed: ${error instanceof Error ? error.message : "Unknown error"}`);
			} finally {
				await client.unbind();
			}
		},

		async listUsers(): Promise<AdUser[]> {
			try {
				if (bindDn && bindPassword) {
					await client.bind(bindDn, bindPassword);
				}

				const { searchEntries } = await client.search(searchBase, {
					scope: "sub",
					filter: "(objectClass=user)",
					attributes: ["dn", "cn", "sAMAccountName", "mail", "memberOf", "userAccountControl"],
				});

				return searchEntries.map((entry) => {
					const cn = Array.isArray(entry.cn) ? entry.cn[0] : entry.cn;
					const sAMAccountName = Array.isArray(entry.sAMAccountName) ? entry.sAMAccountName[0] : entry.sAMAccountName;
					const mail = Array.isArray(entry.mail) ? entry.mail[0] : entry.mail;
					const memberOf = (entry.memberOf as string[]) || [];
					const userAccountControl = Array.isArray(entry.userAccountControl)
						? entry.userAccountControl[0]
						: entry.userAccountControl;

					return {
						id: entry.dn,
						username: typeof sAMAccountName === "string" ? sAMAccountName : sAMAccountName ? String(sAMAccountName) : "",
						displayName: typeof cn === "string" ? cn : cn ? String(cn) : "",
						email: typeof mail === "string" ? mail : mail ? String(mail) : "",
						groups: memberOf,
						enabled: userAccountControl !== undefined ? (parseInt(String(userAccountControl)) & 2) === 0 : true,
					};
				});
			} catch (error) {
				throw new Error(`LDAP list users failed: ${error instanceof Error ? error.message : "Unknown error"}`);
			} finally {
				await client.unbind();
			}
		},

		async getUserById(id: string): Promise<AdUser | null> {
			try {
				if (bindDn && bindPassword) {
					await client.bind(bindDn, bindPassword);
				}

				const { searchEntries } = await client.search(searchBase, {
					scope: "sub",
					filter: `(distinguishedName=${id})`,
					attributes: ["dn", "cn", "sAMAccountName", "mail", "memberOf", "userAccountControl"],
				});

				if (searchEntries.length === 0) {
					return null;
				}

				const entry = searchEntries[0];
				const cn = Array.isArray(entry.cn) ? entry.cn[0] : entry.cn;
				const sAMAccountName = Array.isArray(entry.sAMAccountName) ? entry.sAMAccountName[0] : entry.sAMAccountName;
				const mail = Array.isArray(entry.mail) ? entry.mail[0] : entry.mail;
				const memberOf = (entry.memberOf as string[]) || [];
				const userAccountControl = Array.isArray(entry.userAccountControl)
					? entry.userAccountControl[0]
					: entry.userAccountControl;

				return {
					id: entry.dn,
					username: typeof sAMAccountName === "string" ? sAMAccountName : sAMAccountName ? String(sAMAccountName) : "",
					displayName: typeof cn === "string" ? cn : cn ? String(cn) : "",
					email: typeof mail === "string" ? mail : mail ? String(mail) : "",
					groups: memberOf,
					enabled: userAccountControl !== undefined ? (parseInt(String(userAccountControl)) & 2) === 0 : true,
				};
			} catch (error) {
				throw new Error(`LDAP get user failed: ${error instanceof Error ? error.message : "Unknown error"}`);
			} finally {
				await client.unbind();
			}
		},

		async createUser(input: AdUserInput): Promise<AdUser> {
			const taken = mockAdUsers.some((u) => u.username.toLowerCase() === input.username.toLowerCase());
			if (taken) throw new Error("Ya existe un usuario con ese nombre");

			const user: AdUser = {
				id: `ad-${Date.now()}`,
				...input,
				groups: [...input.groups],
			};
			mockAdUsers.push(user);
			return { ...user, groups: [...user.groups] };
		},

		async updateUser(id: string, input: AdUserInput): Promise<AdUser | null> {
			const index = mockAdUsers.findIndex((u) => u.id === id);
			if (index === -1) return null;

			const taken = mockAdUsers.some((u) => u.id !== id && u.username.toLowerCase() === input.username.toLowerCase());
			if (taken) throw new Error("Ya existe un usuario con ese nombre");

			mockAdUsers[index] = { id, ...input, groups: [...input.groups] };
			return { ...mockAdUsers[index], groups: [...mockAdUsers[index].groups] };
		},

		async deleteUser(id: string): Promise<boolean> {
			const before = mockAdUsers.length;
			mockAdUsers = mockAdUsers.filter((u) => u.id !== id);
			return mockAdUsers.length < before;
		},
	};
}
