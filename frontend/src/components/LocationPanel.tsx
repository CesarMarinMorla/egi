import type { Machine, MachineStatus } from '../types'
import { formatDate } from '../utils/format'

const STATUS_LABEL: Record<MachineStatus, string> = {
  active: 'Activa',
  maintenance: 'Mantenimiento',
  retired: 'Baja',
}

const ASSIGNEE_LABEL = {
  student: 'Alumno',
  teacher: 'Docente',
  technician: 'Técnico',
} as const

interface LocationPanelProps {
  machine: Machine
  canEdit: boolean
}

export default function LocationPanel({ machine, canEdit }: LocationPanelProps) {
  return (
    <section className="detail-card">
      <header className="detail-card__header">
        <h2>Ubicación y asignación</h2>
        {canEdit && (
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            disabled
            title="Próximo paso: modal de edición"
          >
            Editar
          </button>
        )}
      </header>

      <dl className="detail-grid">
        <div>
          <dt>Laboratorio</dt>
          <dd>{machine.lab}</dd>
        </div>
        <div>
          <dt>Banco / mesa</dt>
          <dd>{machine.benchNumber}</dd>
        </div>
        <div>
          <dt>Estado</dt>
          <dd>
            <span className={`status-chip status-chip--${machine.status}`}>
              {STATUS_LABEL[machine.status]}
            </span>
          </dd>
        </div>
        <div>
          <dt>Último mantenimiento</dt>
          <dd>{formatDate(machine.maintenanceDate)}</dd>
        </div>
        <div className="detail-grid__wide">
          <dt>Asignado a</dt>
          <dd>
            {machine.assignee ? (
              <>
                {machine.assignee}
                {machine.assigneeType && (
                  <span className="cell-muted">
                    {' '}
                    ({ASSIGNEE_LABEL[machine.assigneeType]})
                  </span>
                )}
              </>
            ) : (
              <span className="cell-muted">Sin asignación</span>
            )}
          </dd>
        </div>
      </dl>
    </section>
  )
}
