import type { Hardware } from '../types'

const TYPE_LABEL = {
  desktop: 'Desktop',
  laptop: 'Laptop',
} as const

interface HardwarePanelProps {
  hardware: Hardware | null
  canEdit: boolean
  canCreate: boolean
  canDelete: boolean
  onEdit: () => void
  onCreate: () => void
  onDelete: () => void
}

export default function HardwarePanel({
  hardware,
  canEdit,
  canCreate,
  canDelete,
  onEdit,
  onCreate,
  onDelete,
}: HardwarePanelProps) {
  return (
    <section className="detail-card">
      <header className="detail-card__header">
        <h2>Hardware</h2>
        <div className="detail-card__actions">
          {hardware && canEdit && (
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={onEdit}
            >
              Editar
            </button>
          )}
          {!hardware && canCreate && (
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={onCreate}
            >
              Agregar hardware
            </button>
          )}
          {hardware && canDelete && (
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={onDelete}
            >
              Eliminar
            </button>
          )}
        </div>
      </header>

      {!hardware ? (
        <p className="muted">No hay datos de hardware registrados para esta máquina.</p>
      ) : (
        <dl className="detail-grid">
          <div>
            <dt>Tipo</dt>
            <dd>{TYPE_LABEL[hardware.type]}</dd>
          </div>
          <div>
            <dt>Fabricante</dt>
            <dd>{hardware.manufacturer}</dd>
          </div>
          <div>
            <dt>Modelo</dt>
            <dd>{hardware.model}</dd>
          </div>
          <div>
            <dt>CPU</dt>
            <dd>{hardware.cpu}</dd>
          </div>
          <div>
            <dt>RAM</dt>
            <dd>{hardware.ramGb} GB</dd>
          </div>
          <div>
            <dt>Disco</dt>
            <dd>{hardware.diskGb} GB</dd>
          </div>
          <div>
            <dt>Sistema operativo</dt>
            <dd>{hardware.os}</dd>
          </div>
          <div>
            <dt>Monitor</dt>
            <dd>{hardware.monitor}</dd>
          </div>
          <div>
            <dt>Mouse</dt>
            <dd>{hardware.mouse}</dd>
          </div>
          <div>
            <dt>Teclado</dt>
            <dd>{hardware.keyboard}</dd>
          </div>
        </dl>
      )}
    </section>
  )
}
