import { Router, type Response } from 'express'
import * as sqlClient from '../db/sqlClient.js'
import * as mongoClient from '../db/mongoClient.js'
import { canAccessLab } from '../lib/permissions.js'
import { requirePermission } from '../middleware/requirePermission.js'
import type { AuthRequest } from '../middleware/authMiddleware.js'
import type { MachineInput } from '../types/index.js'

const router = Router()

router.get(
  '/',
  requirePermission('read', 'inventory'),
  async (req: AuthRequest, res: Response) => {
    const machines = await sqlClient.listMachines()
    const scoped = machines.filter((machine) =>
      canAccessLab(req.user, machine.lab),
    )
    res.json(scoped)
  },
)

router.get(
  '/:id',
  requirePermission('read', 'inventory'),
  async (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' })
      return
    }

    const machine = await sqlClient.getMachine(id)
    if (!machine) {
      res.status(404).json({ error: 'Máquina no encontrada' })
      return
    }

    if (!canAccessLab(req.user, machine.lab)) {
      res.status(403).json({ error: 'Sin permiso para ver esta máquina' })
      return
    }

    res.json(machine)
  },
)

router.post(
  '/',
  requirePermission('create', 'inventory'),
  async (req: AuthRequest, res: Response) => {
    const input = req.body as MachineInput

    if (!input?.hostname || !input?.lab) {
      res.status(400).json({ error: 'Datos incompletos' })
      return
    }

    if (!canAccessLab(req.user, input.lab)) {
      res
        .status(403)
        .json({ error: 'Sin permiso para crear en ese laboratorio' })
      return
    }

    const machine = await sqlClient.createMachine(input)
    res.status(201).json(machine)
  },
)

router.put(
  '/:id',
  requirePermission('update', 'inventory'),
  async (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' })
      return
    }

    const existing = await sqlClient.getMachine(id)
    if (!existing) {
      res.status(404).json({ error: 'Máquina no encontrada' })
      return
    }

    if (!canAccessLab(req.user, existing.lab)) {
      res
        .status(403)
        .json({ error: 'Sin permiso para editar esta máquina' })
      return
    }

    const input = req.body as Partial<MachineInput>
    if (input?.lab && !canAccessLab(req.user, input.lab)) {
      res
        .status(403)
        .json({ error: 'Sin permiso para asignar ese laboratorio' })
      return
    }

    const updated = await sqlClient.updateMachine(id, input)
    res.json(updated)
  },
)

router.delete(
  '/:id',
  requirePermission('delete', 'inventory'),
  async (req: AuthRequest, res: Response) => {
    const id = Number(req.params.id)
    if (Number.isNaN(id)) {
      res.status(400).json({ error: 'ID inválido' })
      return
    }

    const existing = await sqlClient.getMachine(id)
    if (!existing) {
      res.status(404).json({ error: 'Máquina no encontrada' })
      return
    }

    if (!canAccessLab(req.user, existing.lab)) {
      res
        .status(403)
        .json({ error: 'Sin permiso para eliminar esta máquina' })
      return
    }

    await sqlClient.deleteMachine(id)
    await mongoClient.deleteHardware(id)
    res.status(204).send()
  },
)

export default router
