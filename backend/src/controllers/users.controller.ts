import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware.js'
import type { UsersService } from '../services/users.service.js'
import type { AdUserInput } from '../types/index.js'
import { AppError } from '../lib/errors.js'

export function createUsersController(usersService: UsersService) {
  return {
    async list(_req: AuthRequest, res: Response) {
      const users = await usersService.list()
      res.json(users)
    },

    async create(req: AuthRequest, res: Response) {
      try {
        const user = await usersService.create(req.body as AdUserInput)
        res.status(201).json(user)
      } catch (err) {
        if (err instanceof AppError) {
          res.status(err.statusCode).json({ error: err.message })
          return
        }
        res.status(400).json({
          error: err instanceof Error ? err.message : 'Error al crear usuario',
        })
      }
    },

    async update(req: AuthRequest, res: Response) {
      try {
        const user = await usersService.update(
          req.params.id as string,
          req.body as AdUserInput,
        )
        res.json(user)
      } catch (err) {
        if (err instanceof AppError) {
          res.status(err.statusCode).json({ error: err.message })
          return
        }
        res.status(400).json({
          error:
            err instanceof Error ? err.message : 'Error al actualizar usuario',
        })
      }
    },

    async delete(req: AuthRequest, res: Response) {
      try {
        await usersService.delete(req.params.id as string)
        res.status(204).send()
      } catch (err) {
        if (err instanceof AppError) {
          res.status(err.statusCode).json({ error: err.message })
          return
        }
        throw err
      }
    },
  }
}
