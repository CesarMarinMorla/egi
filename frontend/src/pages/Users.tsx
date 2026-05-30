import { useEffect, useState } from 'react'
import RoleGate from '../components/RoleGate'
import UserFormModal from '../components/UserFormModal'
import UserTable from '../components/UserTable'
import { useAuth } from '../context/AuthContext'
import { can } from '../hooks/usePermissions'
import {
  createAdUser,
  deleteAdUser,
  getAdUsers,
  updateAdUser,
} from '../services/api'
import type { AdUser, AdUserInput } from '../types'

export default function Users() {
  const { user } = useAuth()
  const [adUsers, setAdUsers] = useState<AdUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<AdUser | undefined>()

  const canManage = user ? can(user, 'create', 'users') : false

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getAdUsers()
        if (!cancelled) setAdUsers(data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Error al cargar usuarios',
          )
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  function openCreateModal() {
    setEditingUser(undefined)
    setModalOpen(true)
  }

  function openEditModal(adUser: AdUser) {
    setEditingUser(adUser)
    setModalOpen(true)
  }

  async function handleSubmit(input: AdUserInput) {
    if (editingUser) {
      const updated = await updateAdUser(editingUser.id, input)
      setAdUsers((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      )
      return
    }

    const created = await createAdUser(input)
    setAdUsers((prev) => [...prev, created])
  }

  async function handleDelete(adUser: AdUser) {
    if (
      !window.confirm(
        `¿Eliminar el usuario ${adUser.username}? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }

    try {
      await deleteAdUser(adUser.id)
      setAdUsers((prev) => prev.filter((item) => item.id !== adUser.id))
    } catch (err) {
      window.alert(err instanceof Error ? err.message : 'Error al eliminar')
    }
  }

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
        <header className="page-header page-header--row">
          <div>
            <h1>Usuarios AD</h1>
            <p className="muted">
              {canManage
                ? 'Gestión de cuentas del directorio Active Directory.'
                : 'Vista de solo lectura del directorio Active Directory.'}
            </p>
          </div>

          {canManage && (
            <button
              type="button"
              className="btn btn-primary"
              onClick={openCreateModal}
            >
              Nuevo usuario
            </button>
          )}
        </header>

        {error && <p className="form-error">{error}</p>}

        {isLoading ? (
          <p className="muted">Cargando usuarios…</p>
        ) : (
          <UserTable
            users={adUsers}
            canManage={canManage}
            onEdit={openEditModal}
            onDelete={(adUser) => {
              handleDelete(adUser)
            }}
          />
        )}

        {canManage && (
          <UserFormModal
            open={modalOpen}
            user={editingUser}
            onClose={() => setModalOpen(false)}
            onSubmit={handleSubmit}
          />
        )}
      </section>
    </RoleGate>
  )
}
