import config from './config.js'
import { createApp } from './app.js'

const { machineRepo, hardwareRepo, authRepo, userRepo } = config.mockMode
  ? await importMockRepos()
  : await importRealRepos()

const app = createApp({ machineRepo, hardwareRepo, authRepo, userRepo })

async function importMockRepos() {
  const [mr, hr, ur] = await Promise.all([
    import('./mock/repositories/machine.repository.js'),
    import('./mock/repositories/hardware.repository.js'),
    import('./mock/repositories/user.repository.js'),
  ])
  return {
    machineRepo: mr.mockMachineRepository,
    hardwareRepo: hr.mockHardwareRepository,
    authRepo: ur.mockAuthRepository,
    userRepo: ur.mockUserRepository,
  }
}

async function importRealRepos() {
  const [sqlModule, mockHr, mockUr] = await Promise.all([
    import('./db/sqlClient.js'),
    import('./mock/repositories/hardware.repository.js'),
    import('./mock/repositories/user.repository.js'),
  ])
  const { createSqlMachineRepository } = await import('./repositories/sql/machine.repository.js')
  const sqlClient = await sqlModule.createSqlClient()
  return {
    machineRepo: createSqlMachineRepository(sqlClient),
    hardwareRepo: mockHr.mockHardwareRepository,
    authRepo: mockUr.mockAuthRepository,
    userRepo: mockUr.mockUserRepository,
  }
}

app.listen(config.port, () => {
  console.log(`Backend escuchando en http://localhost:${config.port}`)
  console.log(`Modo mock: ${config.mockMode}`)
})
