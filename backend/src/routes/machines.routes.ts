import { Router } from 'express'
import type { MachinesService } from '../services/machines.service.js'
import { createMachinesController } from '../controllers/machines.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/rbac.middleware.js'

export function createMachinesRouter(machinesService: MachinesService): Router {
  const router = Router()
  const ctrl = createMachinesController(machinesService)

  router.use(authMiddleware)

  router.get('/', requirePermission('read', 'inventory'), (req, res) =>
    ctrl.list(req, res),
  )
  router.get('/:id', requirePermission('read', 'inventory'), (req, res) =>
    ctrl.getById(req, res),
  )
  router.post('/', requirePermission('create', 'inventory'), (req, res) =>
    ctrl.create(req, res),
  )
  router.put('/:id', requirePermission('update', 'inventory'), (req, res) =>
    ctrl.update(req, res),
  )
  router.delete('/:id', requirePermission('delete', 'inventory'), (req, res) =>
    ctrl.delete(req, res),
  )

  return router
}
