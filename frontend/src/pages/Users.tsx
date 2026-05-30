import RoleGate from '../components/RoleGate'

export default function Users() {
  return (
    <RoleGate
      action="read"
      resource="users"
      fallback={
        <section className="page">
          <p className="form-error">No tenés permiso para ver usuarios AD.</p>
        </section>
      }
    >
      <section className="page">
        <header className="page-header">
          <h1>Usuarios AD</h1>
          <p className="muted">
            Gestión de usuarios — próximo paso: tabla mock y modales.
          </p>
        </header>
      </section>
    </RoleGate>
  )
}
