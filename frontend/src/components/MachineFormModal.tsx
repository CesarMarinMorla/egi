import { useEffect, useState, type FormEvent } from 'react'
import type {
  AssigneeType,
  Machine,
  MachineInput,
  MachineStatus,
} from '../types'
import Modal from './Modal'

interface MachineFormModalProps {
  open: boolean
  machine?: Machine
  labs: string[]
  onClose: () => void
  onSubmit: (input: MachineInput) => Promise<void>
}

const EMPTY_FORM: MachineInput = {
  hostname: '',
  lab: '',
  benchNumber: 1,
  maintenanceDate: new Date().toISOString().slice(0, 10),
  status: 'active',
}

export default function MachineFormModal({
  open,
  machine,
  labs,
  onClose,
  onSubmit,
}: MachineFormModalProps) {
  const [form, setForm] = useState<MachineInput>(EMPTY_FORM)
  const [assignee, setAssignee] = useState('')
  const [assigneeType, setAssigneeType] = useState<AssigneeType>('student')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isEdit = machine !== undefined

  useEffect(() => {
    if (!open) return

    if (machine) {
      setForm({
        hostname: machine.hostname,
        lab: machine.lab,
        benchNumber: machine.benchNumber,
        maintenanceDate: machine.maintenanceDate,
        status: machine.status,
        assignee: machine.assignee,
        assigneeType: machine.assigneeType,
      })
      setAssignee(machine.assignee ?? '')
      setAssigneeType(machine.assigneeType ?? 'student')
    } else {
      setForm({ ...EMPTY_FORM, lab: labs[0] ?? '' })
      setAssignee('')
      setAssigneeType('student')
    }

    setError(null)
  }, [open, machine, labs])

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setIsSaving(true)
    setError(null)

    const input: MachineInput = {
      ...form,
      assignee: assignee.trim() || undefined,
      assigneeType: assignee.trim() ? assigneeType : undefined,
    }

    try {
      await onSubmit(input)
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
      title={isEdit ? 'Editar máquina' : 'Nueva máquina'}
      onClose={onClose}
    >
      <form className="modal-form" onSubmit={handleSubmit}>
        <div className="form-grid">
          <label className="field">
            <span>Hostname</span>
            <input
              value={form.hostname}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, hostname: e.target.value }))
              }
              required
              disabled={isSaving}
            />
          </label>

          <label className="field">
            <span>Laboratorio</span>
            <select
              value={form.lab}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, lab: e.target.value }))
              }
              required
              disabled={isSaving}
            >
              {labs.map((lab) => (
                <option key={lab} value={lab}>
                  {lab}
                </option>
              ))}
            </select>
          </label>

          <label className="field">
            <span>Banco / mesa</span>
            <input
              type="number"
              min={1}
              value={form.benchNumber}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  benchNumber: Number(e.target.value),
                }))
              }
              required
              disabled={isSaving}
            />
          </label>

          <label className="field">
            <span>Último mantenimiento</span>
            <input
              type="date"
              value={form.maintenanceDate}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  maintenanceDate: e.target.value,
                }))
              }
              required
              disabled={isSaving}
            />
          </label>

          <label className="field">
            <span>Estado</span>
            <select
              value={form.status}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  status: e.target.value as MachineStatus,
                }))
              }
              disabled={isSaving}
            >
              <option value="active">Activa</option>
              <option value="maintenance">Mantenimiento</option>
              <option value="retired">Baja</option>
            </select>
          </label>

          <label className="field">
            <span>Asignado a</span>
            <input
              value={assignee}
              onChange={(e) => setAssignee(e.target.value)}
              placeholder="Opcional"
              disabled={isSaving}
            />
          </label>

          <label className="field">
            <span>Tipo de asignación</span>
            <select
              value={assigneeType}
              onChange={(e) =>
                setAssigneeType(e.target.value as AssigneeType)
              }
              disabled={isSaving || assignee.trim() === ''}
            >
              <option value="student">Alumno</option>
              <option value="teacher">Docente</option>
              <option value="technician">Técnico</option>
            </select>
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
