import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware.js'
import type { MachinesService } from '../services/machines.service.js'
import type { MachineInput } from '../types/index.js'
import { AppError } from '../lib/errors.js'

export function createMachinesController(machinesService: MachinesService) {
  return {
    async list(req: AuthRequest, res: Response) {
      const machines = await machinesService.listScoped(req.user!)
      res.json(machines)
    },

    async getById(req: AuthRequest, res: Response) {
      const id = Number(req.params.id)

      try {
        if (Number.isNaN(id)) {
          res.status(400).json({ error: 'ID inválido' })
          return
        }
        const machine = await machinesService.getByIdScoped(req.user!, id)
        res.json(machine)
      } catch (err) {
        if (err instanceof AppError) {
          res.status(err.statusCode).json({ error: err.message })
          return
        }
        throw err
      }
    },

    async create(req: AuthRequest, res: Response) {
      try {
        const machine = await machinesService.create(
          req.user!,
          req.body as MachineInput,
        )
        res.status(201).json(machine)
      } catch (err) {
        if (err instanceof AppError) {
          res.status(err.statusCode).json({ error: err.message })
          return
        }
        throw err
      }
    },

    async update(req: AuthRequest, res: Response) {
      const id = Number(req.params.id)

      try {
        if (Number.isNaN(id)) {
          res.status(400).json({ error: 'ID inválido' })
          return
        }
        const machine = await machinesService.update(
          req.user!,
          id,
          req.body as Partial<MachineInput>,
        )
        res.json(machine)
      } catch (err) {
        if (err instanceof AppError) {
          res.status(err.statusCode).json({ error: err.message })
          return
        }
        throw err
      }
    },

    async delete(req: AuthRequest, res: Response) {
      const id = Number(req.params.id)

      try {
        if (Number.isNaN(id)) {
          res.status(400).json({ error: 'ID inválido' })
          return
        }
        await machinesService.delete(req.user!, id)
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
