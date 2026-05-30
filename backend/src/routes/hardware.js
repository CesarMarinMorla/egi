import { Router } from 'express'
import * as mongoClient from '../db/mongoClient.js'
import * as sqlClient from '../db/sqlClient.js'
import { can, canAccessLab } from '../lib/permissions.js'
import { requirePermission } from '../middleware/requirePermission.js'

const router = Router()

async function getAccessibleMachine(machineId, user) {
  const machine = await sqlClient.getMachine(machineId)
  if (!machine) return { error: 'machine_not_found' }
  if (!canAccessLab(user, machine.lab)) return { error: 'forbidden' }
  return { machine }
}

router.get(
  '/:machineId',
  requirePermission('read', 'inventory'),
  async (req, res) => {
    const machineId = Number(req.params.machineId)
    if (Number.isNaN(machineId)) {
      return res.status(400).json({ error: 'ID inválido' })
    }

    const access = await getAccessibleMachine(machineId, req.user)
    if (access.error === 'machine_not_found') {
      return res.status(404).json({ error: 'Máquina no encontrada' })
    }
    if (access.error === 'forbidden') {
      return res.status(403).json({ error: 'Sin permiso para ver esta máquina' })
    }

    const hardware = await mongoClient.getHardware(machineId)
    if (!hardware) {
      return res.status(404).json({ error: 'Hardware no encontrado' })
    }

    return res.json(hardware)
  },
)

router.put('/:machineId', async (req, res) => {
  const machineId = Number(req.params.machineId)
  if (Number.isNaN(machineId)) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  const access = await getAccessibleMachine(machineId, req.user)
  if (access.error === 'machine_not_found') {
    return res.status(404).json({ error: 'Máquina no encontrada' })
  }
  if (access.error === 'forbidden') {
    return res.status(403).json({ error: 'Sin permiso para editar esta máquina' })
  }

  const existing = await mongoClient.getHardware(machineId)
  const action = existing ? 'update' : 'create'

  if (!can(req.user, action, 'inventory')) {
    return res.status(403).json({ error: 'Sin permiso' })
  }

  const saved = await mongoClient.saveHardware(machineId, req.body)
  return res.json(saved)
})

router.delete(
  '/:machineId',
  requirePermission('delete', 'inventory'),
  async (req, res) => {
    const machineId = Number(req.params.machineId)
    if (Number.isNaN(machineId)) {
      return res.status(400).json({ error: 'ID inválido' })
    }

    const access = await getAccessibleMachine(machineId, req.user)
    if (access.error === 'machine_not_found') {
      return res.status(404).json({ error: 'Máquina no encontrada' })
    }
    if (access.error === 'forbidden') {
      return res.status(403).json({
        error: 'Sin permiso para eliminar hardware de esta máquina',
      })
    }

    const deleted = await mongoClient.deleteHardware(machineId)
    if (!deleted) {
      return res.status(404).json({ error: 'Hardware no encontrado' })
    }

    return res.status(204).send()
  },
)

export default router
