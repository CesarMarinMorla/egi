import config from './config.js'
import { createApp } from './app.js'
import { mockMachineRepository } from './mock/repositories/machine.repository.js'
import { mockHardwareRepository } from './mock/repositories/hardware.repository.js'
import { mockUserRepository, mockAuthRepository } from './mock/repositories/user.repository.js'

const app = createApp({
  machineRepo: mockMachineRepository,
  hardwareRepo: mockHardwareRepository,
  authRepo: mockAuthRepository,
  userRepo: mockUserRepository,
})

app.listen(config.port, () => {
  console.log(`Backend escuchando en http://localhost:${config.port}`)
  console.log(`Modo mock: ${config.mockMode}`)
})
