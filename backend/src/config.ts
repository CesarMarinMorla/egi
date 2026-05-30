import dotenv from 'dotenv'

dotenv.config()

interface Config {
  port: number
  jwtSecret: string
  mockMode: boolean
  sql: {
    server: string
    port: number
    user: string
    password: string
    database: string
  }
}

function sqlConfig() {
  const s = (key: string, fallback: string) => process.env[key] ?? fallback
  const parts = (s('SQL_SERVER', 'localhost') + '').split(':')
  return {
    server: parts[0],
    port: Number(parts[1]) || 1433,
    user: s('SQL_USER', 'sa'),
    password: s('SQL_PASSWORD', ''),
    database: s('SQL_DATABASE', 'inventario_itu'),
  }
}

const config: Config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  mockMode: process.env.MOCK_MODE !== 'false',
  sql: sqlConfig(),
}

export default config
