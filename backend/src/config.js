import dotenv from 'dotenv'

dotenv.config()

const config = {
  port: Number(process.env.PORT) || 3001,
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  mockMode: process.env.MOCK_MODE !== 'false',
}

export default config
