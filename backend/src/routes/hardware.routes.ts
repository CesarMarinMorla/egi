import { Router } from 'express'
import type { HardwareService } from '../services/hardware.service.js'
import { createHardwareController } from '../controllers/hardware.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/rbac.middleware.js'

export function createHardwareRouter(hardwareService: HardwareService): Router {
  const router = Router()
  const ctrl = createHardwareController(hardwareService)

  router.use(authMiddleware)

  router.get(
    '/:machineId',
    requirePermission('read', 'inventory'),
    (req, res) => ctrl.getByMachineId(req, res),
  )
  router.put(
    '/:machineId',
    requirePermission('update', 'inventory'),
    (req, res) => ctrl.save(req, res),
  )
  router.delete(
    '/:machineId',
    requirePermission('delete', 'inventory'),
    (req, res) => ctrl.delete(req, res),
  )

  return router
}
