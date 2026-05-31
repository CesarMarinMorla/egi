import { safeValidateAuthSession } from "../utils/validation";

const STORAGE_KEY = "inventario-auth";

export function getStoredToken(): string | null {
	const raw = localStorage.getItem(STORAGE_KEY);
	if (!raw) return null;

	try {
		const parsed = JSON.parse(raw);
		const session = safeValidateAuthSession(parsed);
		return session?.token ?? null;
	} catch {
		return null;
	}
}

export async function readApiError(response: Response, fallback: string): Promise<string> {
	try {
		const data = (await response.json()) as { error?: string };
		if (data.error) return data.error;
	} catch {
		// respuesta vacía o no json
	}

	return fallback;
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
	const headers = new Headers(options.headers);

	if (options.body && !headers.has("Content-Type")) {
		headers.set("Content-Type", "application/json");
	}

	const token = getStoredToken();
	if (token) {
		headers.set("Authorization", `Bearer ${token}`);
	}

	return fetch(path, {
		...options,
		headers,
	});
}
