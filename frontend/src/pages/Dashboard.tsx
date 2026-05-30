import { useEffect, useMemo, useState } from 'react'
import MachineTable from '../components/MachineTable'
import { useAuth } from '../context/AuthContext'
import { can, canAccessLab } from '../hooks/usePermissions'
import { getMachines } from '../services/api'
import type { Machine } from '../types'

export default function Dashboard() {
  const { user } = useAuth()
  const [machines, setMachines] = useState<Machine[]>([])
  const [labFilter, setLabFilter] = useState('all')
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)
      setError(null)

      try {
        const data = await getMachines()
        if (!cancelled) setMachines(data)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Error al cargar máquinas',
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

  const scopedMachines = useMemo(() => {
    if (!user) return []
    return machines.filter((machine) => canAccessLab(user, machine.lab))
  }, [machines, user])

  const availableLabs = useMemo(() => {
    const labs = new Set(scopedMachines.map((machine) => machine.lab))
    return [...labs].sort()
  }, [scopedMachines])

  const filteredMachines = useMemo(() => {
    if (labFilter === 'all') return scopedMachines
    return scopedMachines.filter((machine) => machine.lab === labFilter)
  }, [scopedMachines, labFilter])

  const canCreate = user ? can(user, 'create', 'inventory') : false

  return (
    <section className="page">
      <header className="page-header page-header--row">
        <div>
          <h1>Inventario</h1>
          <p className="muted">
            {scopedMachines.length} máquina
            {scopedMachines.length !== 1 ? 's' : ''} en tu alcance
          </p>
        </div>

        {canCreate && (
          <button
            type="button"
            className="btn btn-primary"
            disabled
            title="Próximo paso: modal de alta"
          >
            Nueva máquina
          </button>
        )}
      </header>

      <div className="toolbar">
        <label className="field field--inline">
          <span>Laboratorio</span>
          <select
            value={labFilter}
            onChange={(e) => setLabFilter(e.target.value)}
            disabled={isLoading || availableLabs.length === 0}
          >
            <option value="all">Todos</option>
            {availableLabs.map((lab) => (
              <option key={lab} value={lab}>
                {lab}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error && <p className="form-error">{error}</p>}

      {isLoading ? (
        <p className="muted">Cargando inventario…</p>
      ) : (
        <MachineTable machines={filteredMachines} />
      )}
    </section>
  )
}
