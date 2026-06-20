import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import type { AuthService } from '../services/auth.service.js'
import { createAuthController } from '../controllers/auth.controller.js'
import config from '../config.js'

export function createAuthRouter(authService: AuthService): Router {
  const router = Router()
  const controller = createAuthController(authService)

  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skip: () => config.mockMode,
    message: { error: 'Demasiados intentos de login. Intente de nuevo en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
  })

  router.post('/login', loginLimiter, (req, res) => controller.login(req, res))

  return router
}
