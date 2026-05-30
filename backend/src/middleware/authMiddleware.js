import jwt from 'jsonwebtoken'
import config from '../config.js'

export function authMiddleware(req, res, next) {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autenticado' })
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, config.jwtSecret)
    req.user = payload.user
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido' })
  }
}
