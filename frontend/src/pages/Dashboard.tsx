import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <section className="page">
      <header className="page-header">
        <h1>Inventario</h1>
        <p className="muted">
          Listado de máquinas — próximo paso: tabla con datos mock.
        </p>
      </header>

      {user && user.labs.length > 0 && (
        <p className="page-meta">
          Alcance: {user.labs.join(', ')}
        </p>
      )}
    </section>
  )
}
