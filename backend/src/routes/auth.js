import { Router } from 'express'
import jwt from 'jsonwebtoken'
import config from '../config.js'
import { authenticate } from '../db/ldapClient.js'

const router = Router()

router.post('/login', async (req, res) => {
  const { username, password } = req.body ?? {}

  if (!username || !password) {
    return res.status(400).json({ error: 'Usuario y contraseña requeridos' })
  }

  try {
    const user = await authenticate(username, password)
    const token = jwt.sign({ user }, config.jwtSecret, { expiresIn: '8h' })
    return res.json({ token, user })
  } catch (err) {
    return res.status(401).json({
      error: err instanceof Error ? err.message : 'Error de autenticación',
    })
  }
})

export default router
