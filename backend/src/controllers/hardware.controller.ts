import type { Response } from 'express'
import type { AuthRequest } from '../middleware/auth.middleware.js'
import type { HardwareService } from '../services/hardware.service.js'
import type { HardwareInput } from '../types/index.js'
import { AppError } from '../lib/errors.js'

export function createHardwareController(hardwareService: HardwareService) {
  return {
    async getByMachineId(req: AuthRequest, res: Response) {
      const machineId = Number(req.params.machineId)

      try {
        if (Number.isNaN(machineId)) {
          res.status(400).json({ error: 'ID inválido' })
          return
        }
        const hardware = await hardwareService.getForMachine(
          req.user!,
          machineId,
        )
        res.json(hardware)
      } catch (err) {
        if (err instanceof AppError) {
          res.status(err.statusCode).json({ error: err.message })
          return
        }
        throw err
      }
    },

    async save(req: AuthRequest, res: Response) {
      const machineId = Number(req.params.machineId)

      try {
        if (Number.isNaN(machineId)) {
          res.status(400).json({ error: 'ID inválido' })
          return
        }
        const hardware = await hardwareService.saveForMachine(
          req.user!,
          machineId,
          req.body as HardwareInput,
        )
        res.json(hardware)
      } catch (err) {
        if (err instanceof AppError) {
          res.status(err.statusCode).json({ error: err.message })
          return
        }
        throw err
      }
    },

    async delete(req: AuthRequest, res: Response) {
      const machineId = Number(req.params.machineId)

      try {
        if (Number.isNaN(machineId)) {
          res.status(400).json({ error: 'ID inválido' })
          return
        }
        await hardwareService.deleteForMachine(req.user!, machineId)
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
