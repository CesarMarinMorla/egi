import { createContext, useCallback, useMemo, useState, type ReactNode } from "react";
import type { AuthSession, User } from "../types";
import { login as apiLogin } from "../services/api";
import { readStoredSession } from "../utils/authStorage";

const STORAGE_KEY = "inventario-auth";

interface AuthContextValue {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
	isLoading: boolean;
	login: (username: string, password: string) => Promise<void>;
	logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
	const [session, setSession] = useState<AuthSession | null>(() => readStoredSession());
	const [isLoading, setIsLoading] = useState(false);

	const login = useCallback(async (username: string, password: string) => {
		setIsLoading(true);
		try {
			const next = await apiLogin(username, password);
			localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
			setSession(next);
		} finally {
			setIsLoading(false);
		}
	}, []);

	const logout = useCallback(() => {
		localStorage.removeItem(STORAGE_KEY);
		setSession(null);
	}, []);

	const value = useMemo<AuthContextValue>(
		() => ({
			user: session?.user ?? null,
			token: session?.token ?? null,
			isAuthenticated: session !== null,
			isLoading,
			login,
			logout,
		}),
		[session, isLoading, login, logout],
	);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
