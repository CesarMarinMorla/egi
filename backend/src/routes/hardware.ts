import { Router, type Response } from 'express'
import * as mongoClient from '../db/mongoClient.js'
import * as sqlClient from '../db/sqlClient.js'
import { can, canAccessLab } from '../lib/permissions.js'
import { requirePermission } from '../middleware/requirePermission.js'
import type { AuthRequest } from '../middleware/authMiddleware.js'
import type { HardwareInput } from '../types/index.js'

const router = Router()

async function getAccessibleMachine(machineId: number, user: unknown) {
  const machine = await sqlClient.getMachine(machineId)
  if (!machine) return { error: 'machine_not_found' as const }
  if (!canAccessLab(user as never, machine.lab))
    return { error: 'forbidden' as const }
  return { machine }
}

router.get(
  '/:machineId',
  requirePermission('read', 'inventory'),
  async (req: AuthRequest, res: Response) => {
    const machineId = Number(req.params.machineId)
    if (Number.isNaN(machineId)) {
      res.status(400).json({ error: 'ID inválido' })
      return
    }

    const access = await getAccessibleMachine(machineId, req.user)
    if (access.error === 'machine_not_found') {
      res.status(404).json({ error: 'Máquina no encontrada' })
      return
    }
    if (access.error === 'forbidden') {
      res
        .status(403)
        .json({ error: 'Sin permiso para ver esta máquina' })
      return
    }

    const hardware = await mongoClient.getHardware(machineId)
    if (!hardware) {
      res.status(404).json({ error: 'Hardware no encontrado' })
      return
    }

    res.json(hardware)
  },
)

router.put(
  '/:machineId',
  async (req: AuthRequest, res: Response) => {
    const machineId = Number(req.params.machineId)
    if (Number.isNaN(machineId)) {
      res.status(400).json({ error: 'ID inválido' })
      return
    }

    const access = await getAccessibleMachine(machineId, req.user)
    if (access.error === 'machine_not_found') {
      res.status(404).json({ error: 'Máquina no encontrada' })
      return
    }
    if (access.error === 'forbidden') {
      res
        .status(403)
        .json({ error: 'Sin permiso para editar esta máquina' })
      return
    }

    const existing = await mongoClient.getHardware(machineId)
    const action = existing ? 'update' : 'create'

    if (!can(req.user, action as never, 'inventory')) {
      res.status(403).json({ error: 'Sin permiso' })
      return
    }

    const saved = await mongoClient.saveHardware(
      machineId,
      req.body as HardwareInput,
    )
    res.json(saved)
  },
)

router.delete(
  '/:machineId',
  requirePermission('delete', 'inventory'),
  async (req: AuthRequest, res: Response) => {
    const machineId = Number(req.params.machineId)
    if (Number.isNaN(machineId)) {
      res.status(400).json({ error: 'ID inválido' })
      return
    }

    const access = await getAccessibleMachine(machineId, req.user)
    if (access.error === 'machine_not_found') {
      res.status(404).json({ error: 'Máquina no encontrada' })
      return
    }
    if (access.error === 'forbidden') {
      res
        .status(403)
        .json({ error: 'Sin permiso para eliminar hardware de esta máquina' })
      return
    }

    const deleted = await mongoClient.deleteHardware(machineId)
    if (!deleted) {
      res.status(404).json({ error: 'Hardware no encontrado' })
      return
    }

    res.status(204).send()
  },
)

export default router
