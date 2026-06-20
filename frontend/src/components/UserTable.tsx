import type { AdUser } from '../types'

interface UserTableProps {
  users: AdUser[]
  canManage: boolean
  onEdit: (user: AdUser) => void
  onDelete: (user: AdUser) => void
}

export default function UserTable({
  users,
  canManage,
  onEdit,
  onDelete,
}: UserTableProps) {
  if (users.length === 0) {
    return <p className="table-empty">No hay usuarios AD registrados.</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Usuario</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Grupos</th>
            <th>Estado</th>
            {canManage && <th>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td className="cell-mono">{user.username}</td>
              <td>{user.displayName}</td>
              <td>{user.email}</td>
              <td>
                <span className="groups-cell">{user.groups.map(g => g.includes(',') ? g.split(',')[0].replace('CN=', '') : g).join(', ')}</span>
              </td>
              <td>
                <span
                  className={`status-chip ${
                    user.enabled
                      ? 'status-chip--active'
                      : 'status-chip--retired'
                  }`}
                >
                  {user.enabled ? 'Activo' : 'Deshabilitado'}
                </span>
              </td>
              {canManage && (
                <td>
                  <div className="table-actions">
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      onClick={() => onEdit(user)}
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => onDelete(user)}
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
