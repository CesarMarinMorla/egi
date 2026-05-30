import { can } from '../lib/permissions.js'

export function requirePermission(action, resource) {
  return (req, res, next) => {
    if (!can(req.user, action, resource)) {
      return res.status(403).json({ error: 'Sin permiso' })
    }
    next()
  }
}
