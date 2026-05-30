import type { Response, NextFunction } from 'express'
import { can } from '../lib/permissions.js'
import type { AuthRequest } from './authMiddleware.js'

export function requirePermission(action: string, resource: string) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    const user = req.user
    if (!user || !can(user, action as never, resource as never)) {
      res.status(403).json({ error: 'Sin permiso' })
      return
    }
    next()
  }
}
