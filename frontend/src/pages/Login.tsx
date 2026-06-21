import { useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

const MOCK_MODE = import.meta.env.VITE_USE_MOCK !== "false";
const DEMO_USERS = ["sysadmin", "manager", "editor", "operator", "readonly"] as const;

export default function Login() {
	const { login, isLoading } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);

	const from = (location.state as { from?: { pathname: string } } | null)?.from?.pathname ?? "/";

	async function handleSubmit(e: FormEvent) {
		e.preventDefault();
		setError(null);

		try {
			await login(username, password);
			navigate(from, { replace: true });
		} catch (err) {
			setError(err instanceof Error ? err.message : "Error al iniciar sesión");
		}
	}

	return (
		<div className="login-page">
			<div className="login-card">
				<header className="login-header">
					<h1>Inventario ITU</h1>
					<p>Gestión de activos — laboratorios de informática</p>
				</header>

				<form className="login-form" onSubmit={handleSubmit}>
					<label className="field">
						<span>Usuario</span>
						<input
							type="text"
							name="username"
							autoComplete="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							required
							disabled={isLoading}
						/>
					</label>

					<label className="field">
						<span>Contraseña</span>
						<input
							type="password"
							name="password"
							autoComplete="current-password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							disabled={isLoading}
						/>
					</label>

					{error && <p className="form-error">{error}</p>}

					<button type="submit" className="btn btn-primary" disabled={isLoading}>
						{isLoading ? "Ingresando…" : "Ingresar"}
					</button>
				</form>

				{MOCK_MODE && (
					<aside className="login-hint">
						<p>Usuarios mock (cualquier contraseña):</p>
						<ul>
							{DEMO_USERS.map((user) => (
								<li key={user}>
									<button type="button" className="link-btn" onClick={() => setUsername(user)} disabled={isLoading}>
										{user}
									</button>
								</li>
							))}
						</ul>
					</aside>
				)}
			</div>
		</div>
	);
}
