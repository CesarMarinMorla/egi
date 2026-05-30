import { Router } from 'express'
import type { UsersService } from '../services/users.service.js'
import { createUsersController } from '../controllers/users.controller.js'
import { authMiddleware } from '../middleware/auth.middleware.js'
import { requirePermission } from '../middleware/rbac.middleware.js'

export function createUsersRouter(usersService: UsersService): Router {
  const router = Router()
  const ctrl = createUsersController(usersService)

  router.use(authMiddleware)

  router.get('/', requirePermission('read', 'users'), (req, res) =>
    ctrl.list(req, res),
  )
  router.post('/', requirePermission('create', 'users'), (req, res) =>
    ctrl.create(req, res),
  )
  router.put('/:id', requirePermission('update', 'users'), (req, res) =>
    ctrl.update(req, res),
  )
  router.delete('/:id', requirePermission('delete', 'users'), (req, res) =>
    ctrl.delete(req, res),
  )

  return router
}
