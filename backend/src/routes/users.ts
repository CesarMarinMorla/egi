import { Router, type Response } from 'express'
import * as adUserStore from '../db/adUserStore.js'
import { requirePermission } from '../middleware/requirePermission.js'
import type { AuthRequest } from '../middleware/authMiddleware.js'
import type { AdUserInput } from '../types/index.js'

const router = Router()

router.get(
  '/',
  requirePermission('read', 'users'),
  async (_req: AuthRequest, res: Response) => {
    const users = await adUserStore.listAdUsers()
    res.json(users)
  },
)

router.post(
  '/',
  requirePermission('create', 'users'),
  async (req: AuthRequest, res: Response) => {
    try {
      const user = await adUserStore.createAdUser(req.body as AdUserInput)
      res.status(201).json(user)
    } catch (err) {
      res.status(400).json({
        error: err instanceof Error ? err.message : 'Error al crear usuario',
      })
    }
  },
)

router.put(
  '/:id',
  requirePermission('update', 'users'),
  async (req: AuthRequest, res: Response) => {
    try {
      const id = req.params.id as string
      const updated = await adUserStore.updateAdUser(
        id,
        req.body as AdUserInput,
      )
      if (!updated) {
        res.status(404).json({ error: 'Usuario no encontrado' })
        return
      }
      res.json(updated)
    } catch (err) {
      res.status(400).json({
        error:
          err instanceof Error ? err.message : 'Error al actualizar usuario',
      })
    }
  },
)

router.delete(
  '/:id',
  requirePermission('delete', 'users'),
  async (req: AuthRequest, res: Response) => {
    const id = req.params.id as string
    const deleted = await adUserStore.deleteAdUser(id)
    if (!deleted) {
      res.status(404).json({ error: 'Usuario no encontrado' })
      return
    }
    res.status(204).send()
  },
)

export default router
