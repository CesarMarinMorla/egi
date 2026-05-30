import sql from 'mssql'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

async function main() {
  await sql.connect({
    server: process.env.SQL_SERVER,
    port: Number(process.env.SQL_PORT) || 1433,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: 'master',
    options: {
      encrypt: process.env.SQL_ENCRYPT === 'true',
      trustServerCertificate: true,
    },
  })

  const schemaPath = resolve(__dirname, '../../database/sql/schema.sql')
  const schema = readFileSync(schemaPath, 'utf8')
  const ddl = schema
    .split('\n')
    .filter(l => !/^\s*(GO|USE|CREATE DATABASE)/i.test(l))
    .join('\n')

  try {
    await sql.query('CREATE DATABASE ' + process.env.SQL_DATABASE)
    console.log('Database created')
  } catch {
    console.log('Database already exists')
  }

  await sql.query('USE ' + process.env.SQL_DATABASE)

  if (process.env.FORCE_RESET === 'true') {
    await sql.query('DROP TABLE IF EXISTS machines')
  }

  const tableExists = await sql.query(
    `SELECT OBJECT_ID('machines', 'U') AS id`,
  )

  if (!tableExists.recordset[0].id) {
    await sql.query(ddl)
    console.log('Tables created and seeded')
  } else {
    console.log('Tables already exist — skipping schema and seed')
  }

  await sql.close()
}

main().catch(err => { console.error(err.message); process.exit(1) })
