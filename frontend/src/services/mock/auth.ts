import type { AuthSession } from "../../types";
import { MOCK_USERS } from "./users";

export async function mockLogin(
	username: string,
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	_password: string,
): Promise<AuthSession> {
	await delay(400);

	const user = MOCK_USERS.find((u) => u.username.toLowerCase() === username.trim().toLowerCase());

	if (!user) {
		throw new Error("Usuario o contraseña incorrectos");
	}

	return {
		token: `mock-jwt-${user.id}-${Date.now()}`,
		user,
	};
}

function delay(ms: number) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
