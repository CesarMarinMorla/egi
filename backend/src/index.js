import cors from 'cors'
import express from 'express'
import config from './config.js'
import { authMiddleware } from './middleware/authMiddleware.js'
import authRoutes from './routes/auth.js'
import hardwareRoutes from './routes/hardware.js'
import machinesRoutes from './routes/machines.js'
import usersRoutes from './routes/users.js'

const app = express()

app.use(cors())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', mockMode: config.mockMode })
})

app.use('/api/auth', authRoutes)
app.use('/api/machines', authMiddleware, machinesRoutes)
app.use('/api/hardware', authMiddleware, hardwareRoutes)
app.use('/api/users', authMiddleware, usersRoutes)

app.use((_req, res) => {
  res.status(404).json({ error: 'Ruta no encontrada' })
})

app.listen(config.port, () => {
  console.log(`Backend escuchando en http://localhost:${config.port}`)
  console.log(`Modo mock: ${config.mockMode}`)
})
