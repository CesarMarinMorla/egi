import { Router } from 'express'
import type { AuthService } from '../services/auth.service.js'
import { createAuthController } from '../controllers/auth.controller.js'

export function createAuthRouter(authService: AuthService): Router {
  const router = Router()
  const controller = createAuthController(authService)

  router.post('/login', (req, res) => controller.login(req, res))

  return router
}
