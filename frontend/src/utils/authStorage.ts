import type { AuthSession } from "../types";
import { safeValidateAuthSession } from "./validation";

const STORAGE_KEY = "inventario-auth";

export function readStoredSession(): AuthSession | null {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw);
		const session = safeValidateAuthSession(parsed);
		return session;
	} catch {
		localStorage.removeItem(STORAGE_KEY);
		return null;
	}
}
