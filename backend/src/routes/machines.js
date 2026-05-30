import { Router } from 'express'
import * as sqlClient from '../db/sqlClient.js'
import * as mongoClient from '../db/mongoClient.js'
import { canAccessLab } from '../lib/permissions.js'
import { requirePermission } from '../middleware/requirePermission.js'

const router = Router()

router.get('/', requirePermission('read', 'inventory'), async (req, res) => {
  const machines = await sqlClient.listMachines()
  const scoped = machines.filter((machine) =>
    canAccessLab(req.user, machine.lab),
  )
  return res.json(scoped)
})

router.get('/:id', requirePermission('read', 'inventory'), async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  const machine = await sqlClient.getMachine(id)
  if (!machine) {
    return res.status(404).json({ error: 'Máquina no encontrada' })
  }

  if (!canAccessLab(req.user, machine.lab)) {
    return res.status(403).json({ error: 'Sin permiso para ver esta máquina' })
  }

  return res.json(machine)
})

router.post('/', requirePermission('create', 'inventory'), async (req, res) => {
  const input = req.body

  if (!input?.hostname || !input?.lab) {
    return res.status(400).json({ error: 'Datos incompletos' })
  }

  if (!canAccessLab(req.user, input.lab)) {
    return res.status(403).json({ error: 'Sin permiso para crear en ese laboratorio' })
  }

  const machine = await sqlClient.createMachine(input)
  return res.status(201).json(machine)
})

router.put('/:id', requirePermission('update', 'inventory'), async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  const existing = await sqlClient.getMachine(id)
  if (!existing) {
    return res.status(404).json({ error: 'Máquina no encontrada' })
  }

  if (!canAccessLab(req.user, existing.lab)) {
    return res.status(403).json({ error: 'Sin permiso para editar esta máquina' })
  }

  const input = req.body
  if (input?.lab && !canAccessLab(req.user, input.lab)) {
    return res.status(403).json({ error: 'Sin permiso para asignar ese laboratorio' })
  }

  const updated = await sqlClient.updateMachine(id, input)
  return res.json(updated)
})

router.delete('/:id', requirePermission('delete', 'inventory'), async (req, res) => {
  const id = Number(req.params.id)
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'ID inválido' })
  }

  const existing = await sqlClient.getMachine(id)
  if (!existing) {
    return res.status(404).json({ error: 'Máquina no encontrada' })
  }

  if (!canAccessLab(req.user, existing.lab)) {
    return res.status(403).json({ error: 'Sin permiso para eliminar esta máquina' })
  }

  await sqlClient.deleteMachine(id)
  await mongoClient.deleteHardware(id)
  return res.status(204).send()
})

export default router
