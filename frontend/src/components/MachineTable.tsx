import type { Machine, MachineStatus } from '../types'

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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-AR')
}

interface MachineTableProps {
  machines: Machine[]
}

export default function MachineTable({ machines }: MachineTableProps) {
  if (machines.length === 0) {
    return <p className="table-empty">No hay máquinas para mostrar.</p>
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Hostname</th>
            <th>Laboratorio</th>
            <th>Banco</th>
            <th>Asignado a</th>
            <th>Estado</th>
            <th>Mantenimiento</th>
          </tr>
        </thead>
        <tbody>
          {machines.map((machine) => (
            <tr key={machine.id}>
              <td className="cell-mono">{machine.hostname}</td>
              <td>{machine.lab}</td>
              <td>{machine.benchNumber}</td>
              <td>
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
                  <span className="cell-muted">—</span>
                )}
              </td>
              <td>
                <span className={`status-chip status-chip--${machine.status}`}>
                  {STATUS_LABEL[machine.status]}
                </span>
              </td>
              <td>{formatDate(machine.maintenanceDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
