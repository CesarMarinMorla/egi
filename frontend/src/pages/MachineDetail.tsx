import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import HardwarePanel from '../components/HardwarePanel'
import LocationPanel from '../components/LocationPanel'
import { useAuth } from '../context/AuthContext'
import { can, canAccessLab } from '../hooks/usePermissions'
import { getHardware, getMachine } from '../services/api'
import type { Hardware, Machine } from '../types'

export default function MachineDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [hardware, setHardware] = useState<Hardware | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)

  const machineId = Number(id)

  useEffect(() => {
    if (!user || Number.isNaN(machineId)) {
      setIsLoading(false)
      return
    }

    let cancelled = false

    const currentUser = user

    async function load() {
      setIsLoading(true)
      setError(null)
      setForbidden(false)

      try {
        const [machineData, hardwareData] = await Promise.all([
          getMachine(machineId),
          getHardware(machineId),
        ])

        if (cancelled) return

        if (!machineData) {
          setMachine(null)
          setHardware(null)
          return
        }

        if (!canAccessLab(currentUser, machineData.lab)) {
          setForbidden(true)
          setMachine(null)
          setHardware(null)
          return
        }

        setMachine(machineData)
        setHardware(hardwareData)
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Error al cargar el detalle',
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
  }, [user, machineId])

  if (Number.isNaN(machineId)) {
    return (
      <section className="page">
        <p className="form-error">ID de máquina inválido.</p>
        <Link to="/" className="btn btn-secondary">
          Volver al inventario
        </Link>
      </section>
    )
  }

  if (isLoading) {
    return (
      <section className="page">
        <p className="muted">Cargando detalle…</p>
      </section>
    )
  }

  if (error) {
    return (
      <section className="page">
        <p className="form-error">{error}</p>
        <Link to="/" className="btn btn-secondary">
          Volver al inventario
        </Link>
      </section>
    )
  }

  if (forbidden) {
    return (
      <section className="page">
        <p className="form-error">No tenés permiso para ver esta máquina.</p>
        <Link to="/" className="btn btn-secondary">
          Volver al inventario
        </Link>
      </section>
    )
  }

  if (!machine || !user) {
    return (
      <section className="page">
        <p className="form-error">Máquina no encontrada.</p>
        <Link to="/" className="btn btn-secondary">
          Volver al inventario
        </Link>
      </section>
    )
  }

  const canEdit = can(user, 'update', 'inventory')
  const canCreateHardware = can(user, 'create', 'inventory')

  return (
    <section className="page">
      <header className="page-header">
        <Link to="/" className="back-link">
          ← Inventario
        </Link>
        <h1 className="cell-mono">{machine.hostname}</h1>
        <p className="muted">
          {machine.lab} · Banco {machine.benchNumber}
        </p>
      </header>

      <div className="detail-columns">
        <LocationPanel machine={machine} canEdit={canEdit} />
        <HardwarePanel
          hardware={hardware}
          canEdit={canEdit}
          canCreate={canCreateHardware}
        />
      </div>
    </section>
  )
}
