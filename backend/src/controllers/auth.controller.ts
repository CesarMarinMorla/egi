import type { Response } from 'express'
import type { AuthService } from '../services/auth.service.js'
import type { AuthRequest } from '../middleware/auth.middleware.js'

export function createAuthController(authService: AuthService) {
  return {
    async login(req: AuthRequest, res: Response) {
      const { username, password } = req.body ?? {}

      if (!username || !password) {
        res.status(400).json({ error: 'Usuario y contraseña requeridos' })
        return
      }

      try {
        const result = await authService.login(username, password)
        res.json(result)
      } catch (err) {
        res.status(401).json({
          error: err instanceof Error ? err.message : 'Error de autenticación',
        })
      }
    },
  }
}
