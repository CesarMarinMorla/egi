import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import type { AuthService } from '../services/auth.service.js'
import { createAuthController } from '../controllers/auth.controller.js'
import config from '../config.js'

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.mockMode ? 1000 : 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Demasiados intentos. Vuelve a intentarlo en 15 minutos.' },
})

export function createAuthRouter(authService: AuthService): Router {
  const router = Router()
  const controller = createAuthController(authService)

  router.post('/login', loginLimiter, (req, res) => controller.login(req, res))

  return router
}