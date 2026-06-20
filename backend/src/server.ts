import config from './config.js'
import { createApp } from './app.js'
import { withRetry } from './utils/retry.js'

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
  const [sqlModule, mongoModule, ldapModule] = await Promise.all([
    import('./db/sqlClient.js'),
    import('./db/mongoClient.js'),
    import('./db/ldapClient.js'),
  ])
  const [sqlMachineRepo, mongoHardwareRepo, ldapUserRepo] = await Promise.all([
    import('./repositories/sql/machine.repository.js'),
    import('./repositories/mongo/hardware.repository.js'),
    import('./repositories/ldap/user.repository.js'),
  ])
  const sqlClient = await withRetry(() => sqlModule.createSqlClient(), 'SQL Server')
  const mongoClient = await withRetry(() => mongoModule.createMongoClient(), 'MongoDB')
  const ldapClient = await ldapModule.createLdapClient()
  return {
    machineRepo: sqlMachineRepo.createSqlMachineRepository(sqlClient),
    hardwareRepo: mongoHardwareRepo.createMongoHardwareRepository(mongoClient),
    authRepo: ldapClient,
    userRepo: ldapUserRepo.createLdapUserRepository(ldapClient),
  }
}

app.listen(config.port, () => {
  console.log(`Backend escuchando en http://localhost:${config.port}`)
  console.log(`Modo mock: ${config.mockMode}`)
})
