import { Router } from 'express'
import * as adUserStore from '../db/adUserStore.js'
import { requirePermission } from '../middleware/requirePermission.js'

const router = Router()

router.get('/', requirePermission('read', 'users'), async (_req, res) => {
  const users = await adUserStore.listAdUsers()
  return res.json(users)
})

router.post('/', requirePermission('create', 'users'), async (req, res) => {
  try {
    const user = await adUserStore.createAdUser(req.body)
    return res.status(201).json(user)
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'Error al crear usuario',
    })
  }
})

router.put('/:id', requirePermission('update', 'users'), async (req, res) => {
  try {
    const updated = await adUserStore.updateAdUser(req.params.id, req.body)
    if (!updated) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    return res.json(updated)
  } catch (err) {
    return res.status(400).json({
      error: err instanceof Error ? err.message : 'Error al actualizar usuario',
    })
  }
})

router.delete('/:id', requirePermission('delete', 'users'), async (req, res) => {
  const deleted = await adUserStore.deleteAdUser(req.params.id)
  if (!deleted) {
    return res.status(404).json({ error: 'Usuario no encontrado' })
  }
  return res.status(204).send()
})

export default router
