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
  const [sqlModule, mongoModule, mockUr] = await Promise.all([
    import('./db/sqlClient.js'),
    import('./db/mongoClient.js'),
    // import('./mock/repositories/hardware.repository.js'),  // ← descomentar para mock hardware
    import('./mock/repositories/user.repository.js'),
  ])
  const [sqlMachineRepo, mongoHardwareRepo] = await Promise.all([
    import('./repositories/sql/machine.repository.js'),
    import('./repositories/mongo/hardware.repository.js'),
  ])
  const sqlClient = await sqlModule.createSqlClient()
  const mongoClient = await mongoModule.createMongoClient()
  return {
    machineRepo: sqlMachineRepo.createSqlMachineRepository(sqlClient),
    // hardwareRepo: mockHr.mockHardwareRepository  ← descomentar y comentar la de abajo para mock
    hardwareRepo: mongoHardwareRepo.createMongoHardwareRepository(mongoClient),
    authRepo: mockUr.mockAuthRepository,
    userRepo: mockUr.mockUserRepository,
  }
}

app.listen(config.port, () => {
  console.log(`Backend escuchando en http://localhost:${config.port}`)
  console.log(`Modo mock: ${config.mockMode}`)
})
