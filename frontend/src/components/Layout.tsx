import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { can } from "../hooks/usePermissions";

export default function Layout() {
	const { user, logout } = useAuth();
	const navigate = useNavigate();

	if (!user) return null;

	function handleLogout() {
		logout();
		navigate("/login", { replace: true });
	}

	return (
		<div className="app-shell">
			<header className="app-header">
				<div className="app-header__brand">
					<NavLink to="/" className="app-title">
						Inventario ITU
					</NavLink>
				</div>

				<nav className="app-nav" aria-label="Principal">
					<NavLink to="/" className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")} end>
						Inventario
					</NavLink>
					{can(user, "read", "users") && (
						<NavLink to="/users" className={({ isActive }) => (isActive ? "nav-link nav-link--active" : "nav-link")}>
							Usuarios
						</NavLink>
					)}
				</nav>

				<div className="app-header__user">
					<span className="user-name">{user.displayName}</span>
					<span className="role-badge">{user.role}</span>
					<button type="button" className="btn btn-secondary btn-sm" onClick={handleLogout}>
						Salir
					</button>
				</div>
			</header>

			<main className="app-main">
				<Outlet />
			</main>
		</div>
	);
}
