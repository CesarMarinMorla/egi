import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config.js'
import type { AuthPayload, User } from '../types/index.js'

export interface AuthRequest extends Request {
  user?: User
}

export function authMiddleware(
  req: AuthRequest,
  res: Response,
  next: NextFunction,
): void {
  const header = req.headers.authorization

  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No autenticado' })
    return
  }

  try {
    const token = header.slice(7)
    const payload = jwt.verify(token, config.jwtSecret, {
      audience: config.jwtAudience,
      issuer: config.jwtIssuer,
    }) as AuthPayload
    req.user = payload.user
    next()
  } catch {
    res.status(401).json({ error: 'Token inválido' })
  }
}
