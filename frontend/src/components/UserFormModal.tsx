import { useEffect, useState, type FormEvent } from 'react'
import { AD_GROUPS, type AdGroup, type AdUser, type AdUserInput } from '../types'
import Modal from './Modal'

interface UserFormModalProps {
  open: boolean
  user?: AdUser
  onClose: () => void
  onSubmit: (input: AdUserInput) => Promise<void>
}

const EMPTY_FORM: AdUserInput = {
  username: '',
  displayName: '',
  email: '',
  groups: ['GRP_ReadOnly'],
  enabled: true,
}

export default function UserFormModal({
  open,
  user,
  onClose,
  onSubmit,
}: UserFormModalProps) {
  const [form, setForm] = useState<AdUserInput>(EMPTY_FORM)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = user !== undefined

  useEffect(() => {
    if (!open) return

    if (user) {
      setForm({
        username: user.username,
        displayName: user.displayName,
        email: user.email,
        groups: [...user.groups],
        enabled: user.enabled,
      })
    } else {
      setForm(EMPTY_FORM)
    }

    setError(null)
  }, [open, user])

  function toggleGroup(group: AdGroup) {
    setForm((prev) => {
      const hasGroup = prev.groups.includes(group)
      const groups = hasGroup
        ? prev.groups.filter((item) => item !== group)
        : [...prev.groups, group]

      return { ...prev, groups }
    })
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    if (form.groups.length === 0) {
      setError('Seleccioná al menos un grupo AD')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      await onSubmit(form)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al guardar')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open={open}
      title={isEdit ? 'Editar usuario AD' : 'Nuevo usuario AD'}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Usuario</span>
            <input
              value={form.username}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, username: e.target.value }))
              }
              required
              disabled={isSaving}
            />
          </label>

          <label className="field">
            <span>Nombre completo</span>
            <input
              value={form.displayName}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, displayName: e.target.value }))
              }
              required
              disabled={isSaving}
            />
          </label>

          <label className="field form-grid__wide">
            <span>Email</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, email: e.target.value }))
              }
              required
              disabled={isSaving}
            />
          </label>

          <fieldset className="field form-grid__wide group-fieldset">
            <legend>Grupos AD</legend>
            <div className="checkbox-list">
              {AD_GROUPS.map((group) => (
                <label key={group} className="checkbox-item">
                  <input
                    type="checkbox"
                    checked={form.groups.includes(group)}
                    onChange={() => toggleGroup(group)}
                    disabled={isSaving}
                  />
                  <span>{group}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="checkbox-item form-grid__wide">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, enabled: e.target.checked }))
              }
              disabled={isSaving}
            />
            <span>Cuenta habilitada</span>
          </label>
        </div>

        {error && <p className="form-error">{error}</p>}

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSaving}>
            {isSaving ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
