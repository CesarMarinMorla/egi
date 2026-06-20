import { Client, Change, Attribute } from "ldapts";
import type { User, UserRole, AdUser, AdUserInput } from "../types/index.js";

export interface ILdapClient {
	authenticate(username: string, password: string): Promise<User>;
	listUsers(): Promise<AdUser[]>;
	getUserById(id: string): Promise<AdUser | null>;
	createUser(input: AdUserInput): Promise<AdUser>;
	updateUser(id: string, input: AdUserInput): Promise<AdUser | null>;
	deleteUser(id: string): Promise<boolean>;
}

function escapeLdapFilter(input: string): string {
	return input
		.replace(/\\/g, "\\5c")
		.replace(/\*/g, "\\2a")
		.replace(/\(/g, "\\28")
		.replace(/\)/g, "\\29")
		.replace(/\0/g, "\\00");
}

function escapeLdapDn(input: string): string {
	return input
		.replace(/\\/g, "\\\\")
		.replace(/,/g, "\\,")
		.replace(/\+/g, "\\+")
		.replace(/"/g, '\\"')
		.replace(/</g, "\\<")
		.replace(/>/g, "\\>")
		.replace(/;/g, "\\;")
		.replace(/=/g, "\\=")
		.replace(/#/g, "\\#");
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
                const match = group.match(/^CN=([^,]+)/i);
                const groupName = match ? match[1] : group;
                const baseGroupName = groupName.replace(/_Lab\d+$/i, "");
                if (groupMap[baseGroupName]) {
                        return groupMap[baseGroupName];
                }
        }

	return "readonly"; // Default role
}

export async function createLdapClient(): Promise<ILdapClient> {
	const mockMode = process.env.MOCK_MODE !== "false";
	const ldapUrl = process.env.LDAP_URL || "ldaps://localhost:636";
	const bindDn = process.env.LDAP_BIND_DN || "";
	const bindPassword = process.env.LDAP_BIND_PASSWORD || "";
	const searchBase = process.env.LDAP_SEARCH_BASE || "dc=itu,dc=local";
	const searchFilter = process.env.LDAP_SEARCH_FILTER || "(sAMAccountName={username})";

	if (!mockMode && (!bindDn || !bindPassword)) {
		throw new Error("LDAP_BIND_DN and LDAP_BIND_PASSWORD must be set when MOCK_MODE=false");
	}

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
					filter: searchFilter.replace("{username}", escapeLdapFilter(username)),
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
				const memberOf = Array.isArray(userEntry.memberOf) ? (userEntry.memberOf as string[]) : userEntry.memberOf ? [userEntry.memberOf as string] : [];

				// Map AD groups to role
				const role = mapAdGroupToRole(memberOf);

				// Extract labs from groups (assuming format like GRP_Editor_Lab101, etc.)
				const labs = memberOf
					.filter((group: string) => group.includes("Lab"))
					.map((group: string) => {
						const match = group.match(/Lab\s*(\d+)/i);
						return match ? `Lab ${match[1]}` : "";
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

				const { searchEntries } = await client.search(`OU=EGI,${searchBase}`, {
					scope: "sub",
					filter: "(objectClass=user)",
					attributes: ["dn", "cn", "sAMAccountName", "mail", "memberOf", "userAccountControl"],
				});

				return searchEntries.map((entry) => {
					const cn = Array.isArray(entry.cn) ? entry.cn[0] : entry.cn;
					const sAMAccountName = Array.isArray(entry.sAMAccountName) ? entry.sAMAccountName[0] : entry.sAMAccountName;
					const mail = Array.isArray(entry.mail) ? entry.mail[0] : entry.mail;
					const memberOf = Array.isArray(entry.memberOf) ? (entry.memberOf as string[]) : entry.memberOf ? [entry.memberOf as string] : [];
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
					filter: `(distinguishedName=${escapeLdapFilter(id)})`,
					attributes: ["dn", "cn", "sAMAccountName", "mail", "memberOf", "userAccountControl"],
				});

				if (searchEntries.length === 0) {
					return null;
				}

				const entry = searchEntries[0];
				const cn = Array.isArray(entry.cn) ? entry.cn[0] : entry.cn;
				const sAMAccountName = Array.isArray(entry.sAMAccountName) ? entry.sAMAccountName[0] : entry.sAMAccountName;
				const mail = Array.isArray(entry.mail) ? entry.mail[0] : entry.mail;
				const memberOf = Array.isArray(entry.memberOf) ? (entry.memberOf as string[]) : entry.memberOf ? [entry.memberOf as string] : [];
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
			if (!bindDn || !bindPassword) throw new Error("LDAP bind credentials not configured");

			await client.bind(bindDn, bindPassword);

			const cn = input.displayName || input.username;
			const dn = `CN=${cn},OU=EGI,${searchBase}`;


			await client.add(dn, {
				objectClass: ["top", "person", "organizationalPerson", "user"],
				cn,
				sAMAccountName: input.username,
				userPrincipalName: `${input.username}@${searchBase.replace(/DC=/gi, "").replace(/,/g, ".")}`,
				displayName: input.displayName,
				mail: input.email,
				userAccountControl: "514",
			});

			for (const group of input.groups) {
				try {
					await client.modify(`CN=${group},OU=EGI,${searchBase}`, [
						new Change({ operation: "add", modification: new Attribute({ type: "member", values: [dn] }) }),
					]);
				} catch {
					// group may not exist, continue
				}
			}

			await client.unbind();

			return { id: dn, username: input.username, displayName: input.displayName, email: input.email, groups: input.groups, enabled: input.enabled };
		},

		async updateUser(id: string, input: AdUserInput): Promise<AdUser | null> {
			if (!bindDn || !bindPassword) throw new Error("LDAP bind credentials not configured");

			await client.bind(bindDn, bindPassword);

			const modifications: Change[] = [
				new Change({ operation: "replace", modification: new Attribute({ type: "displayName", values: [input.displayName] }) }),
				new Change({ operation: "replace", modification: new Attribute({ type: "mail", values: [input.email] }) }),
				new Change({ operation: "replace", modification: new Attribute({ type: "userAccountControl", values: [input.enabled ? "512" : "514"] }) }),
			];

			const encodedPassword = input.password ? Buffer.from(`"${input.password}"`, "utf16le") : null;
				if (input.password && encodedPassword) {
				modifications.push(new Change({ operation: "replace", modification: new Attribute({ type: "unicodePwd", values: [encodedPassword.toString("base64")] }) }));
			}

			try {
				await client.modify(id, modifications);
			} catch {
				await client.unbind();
				return null;
			}

			await client.unbind();
                        // Actualizar grupos
                        try {
                                await client.bind(bindDn, bindPassword);
                                const { searchEntries } = await client.search(`OU=EGI,${searchBase}`, {
                                        scope: "sub",
                                        filter: `(member=${id})`,
                                        attributes: ["dn"],
                                });
                                for (const entry of searchEntries) {
                                        try { await client.modify(entry.dn, [new Change({ operation: "delete", modification: new Attribute({ type: "member", values: [id] }) })]); } catch { }
                                }
                                for (const group of input.groups) {
                                        const groupDn = group.includes(",") ? group : `CN=${group},OU=EGI,${searchBase}`;
                                        try { await client.modify(groupDn, [new Change({ operation: "add", modification: new Attribute({ type: "member", values: [id] }) })]); } catch { }
                                }
                                await client.unbind();
                        } catch { }

			return { id, username: input.username, displayName: input.displayName, email: input.email, groups: input.groups, enabled: input.enabled };
		},

		async deleteUser(id: string): Promise<boolean> {
			if (!bindDn || !bindPassword) throw new Error("LDAP bind credentials not configured");

			await client.bind(bindDn, bindPassword);

			try {
				await client.del(id);
				await client.unbind();
				return true;
			} catch {
				await client.unbind();
				return false;
			}
		},
	};
}
