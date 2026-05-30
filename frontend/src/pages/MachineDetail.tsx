import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import HardwareFormModal from '../components/HardwareFormModal'
import HardwarePanel from '../components/HardwarePanel'
import LocationPanel from '../components/LocationPanel'
import MachineFormModal from '../components/MachineFormModal'
import { useAuth } from '../context/AuthContext'
import { can, canAccessLab } from '../hooks/usePermissions'
import {
  deleteHardware,
  deleteMachine,
  getHardware,
  getMachine,
  saveHardware,
  updateMachine,
} from '../services/api'
import { ALL_LABS, type Hardware, type Machine, type MachineInput } from '../types'

export default function MachineDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [machine, setMachine] = useState<Machine | null>(null)
  const [hardware, setHardware] = useState<Hardware | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [forbidden, setForbidden] = useState(false)
  const [machineModalOpen, setMachineModalOpen] = useState(false)
  const [hardwareModalOpen, setHardwareModalOpen] = useState(false)

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

  const editLabs = useMemo(() => {
    if (!user) return []
    if (user.role === 'sysadmin' || user.role === 'manager') {
      return [...ALL_LABS]
    }
    return user.labs
  }, [user])

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

  const currentMachine = machine
  const currentUser = user
  const canEdit = can(currentUser, 'update', 'inventory')
  const canCreateHardware = can(currentUser, 'create', 'inventory')
  const canDelete = can(currentUser, 'delete', 'inventory')

  async function handleUpdateMachine(input: MachineInput) {
    if (!canAccessLab(currentUser, input.lab)) {
      throw new Error('No tenés permiso para asignar ese laboratorio')
    }

    const updated = await updateMachine(currentMachine.id, input)
    setMachine(updated)
  }

  async function handleSaveHardware(input: Parameters<typeof saveHardware>[1]) {
    const saved = await saveHardware(currentMachine.id, input)
    setHardware(saved)
  }

  async function handleDeleteMachine() {
    if (
      !window.confirm(
        `¿Eliminar la máquina ${currentMachine.hostname}? Esta acción no se puede deshacer.`,
      )
    ) {
      return
    }

    await deleteMachine(currentMachine.id)
    navigate('/', { replace: true })
  }

  async function handleDeleteHardware() {
    if (
      !window.confirm('¿Eliminar el hardware registrado para esta máquina?')
    ) {
      return
    }

    await deleteHardware(currentMachine.id)
    setHardware(null)
  }

  return (
    <section className="page">
      <header className="page-header page-header--row">
        <div>
          <Link to="/" className="back-link">
            ← Inventario
          </Link>
          <h1 className="cell-mono">{currentMachine.hostname}</h1>
          <p className="muted">
            {currentMachine.lab} · Banco {currentMachine.benchNumber}
          </p>
        </div>

        {canDelete && (
          <button
            type="button"
            className="btn btn-danger"
            onClick={() => {
              handleDeleteMachine().catch((err) => {
                window.alert(
                  err instanceof Error ? err.message : 'Error al eliminar',
                )
              })
            }}
          >
            Eliminar máquina
          </button>
        )}
      </header>

      <div className="detail-columns">
        <LocationPanel
          machine={currentMachine}
          canEdit={canEdit}
          onEdit={() => setMachineModalOpen(true)}
        />
        <HardwarePanel
          hardware={hardware}
          canEdit={canEdit}
          canCreate={canCreateHardware}
          canDelete={canDelete}
          onEdit={() => setHardwareModalOpen(true)}
          onCreate={() => setHardwareModalOpen(true)}
          onDelete={() => {
            handleDeleteHardware().catch((err) => {
              window.alert(
                err instanceof Error ? err.message : 'Error al eliminar',
              )
            })
          }}
        />
      </div>

      <MachineFormModal
        open={machineModalOpen}
        machine={currentMachine}
        labs={editLabs}
        onClose={() => setMachineModalOpen(false)}
        onSubmit={handleUpdateMachine}
      />

      <HardwareFormModal
        open={hardwareModalOpen}
        hardware={hardware}
        onClose={() => setHardwareModalOpen(false)}
        onSubmit={handleSaveHardware}
      />
    </section>
  )
}
