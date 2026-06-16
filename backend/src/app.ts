import cors from 'cors'
import helmet from 'helmet'
import express from 'express'
import config from './config.js'
import type { IMachineRepository } from './repositories/interfaces/IMachineRepository.js'
import type { IHardwareRepository } from './repositories/interfaces/IHardwareRepository.js'
import type { IAuthRepository, IUserRepository } from './repositories/interfaces/IUserRepository.js'
import { createAuthService } from './services/auth.service.js'
import { createMachinesService } from './services/machines.service.js'
import { createHardwareService } from './services/hardware.service.js'
import { createUsersService } from './services/users.service.js'
import { createAuthRouter } from './routes/auth.routes.js'
import { createMachinesRouter } from './routes/machines.routes.js'
import { createHardwareRouter } from './routes/hardware.routes.js'
import { createUsersRouter } from './routes/users.routes.js'

export interface AppDependencies {
  machineRepo: IMachineRepository
  hardwareRepo: IHardwareRepository
  authRepo: IAuthRepository
  userRepo: IUserRepository
}

export function createApp(deps: AppDependencies) {
  const app = express()

  app.use(helmet())
  app.use(cors({ origin: config.corsOrigins }))
  app.use(express.json())

  const authService = createAuthService(deps.authRepo)
  const machinesService = createMachinesService(deps.machineRepo, deps.hardwareRepo)
  const hardwareService = createHardwareService(deps.machineRepo, deps.hardwareRepo)
  const usersService = createUsersService(deps.userRepo)

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', mockMode: config.mockMode })
  })

  app.use('/api/auth', createAuthRouter(authService))
  app.use('/api/machines', createMachinesRouter(machinesService))
  app.use('/api/hardware', createHardwareRouter(hardwareService))
  app.use('/api/users', createUsersRouter(usersService))

  app.use((_req, res) => {
    res.status(404).json({ error: 'Ruta no encontrada' })
  })

  return app
}
