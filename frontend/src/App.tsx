import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Login'

function AppContent() {
  const { isAuthenticated, user, logout } = useAuth()

  if (!isAuthenticated || !user) {
    return <Login />
  }

  return (
    <main className="placeholder-shell">
      <p>
        Sesión iniciada como <strong>{user.displayName}</strong>{' '}
        <span className="role-badge">{user.role}</span>
      </p>
      {user.labs.length > 0 && (
        <p className="muted">Labs: {user.labs.join(', ')}</p>
      )}
      <button type="button" className="btn btn-secondary" onClick={logout}>
        Cerrar sesión
      </button>
    </main>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
