import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import * as Sentry from '@sentry/node'

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    release: process.env.SENTRY_RELEASE,
    sendDefaultPii: false,
  })
}

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

try {
  await pool.query('BEGIN')
  await pool.query('CREATE TABLE IF NOT EXISTS migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now());')
  await pool.query('COMMIT')

  const migrationsDir = path.join(import.meta.dirname, 'migrations')

  const allMigrations: string[] | null = fs.readdirSync(migrationsDir, 'utf8');

  const result = await pool.query('SELECT filename FROM migrations')

  const migratedList: string[] | null = result.rows.map(row => row.filename);

  const filteredList: string[] | null =  allMigrations.filter(m => !migratedList.includes(m));

  for (const migration of filteredList) {
    const client = await pool.connect()
    try {
        await client.query('BEGIN')
        const fileContent: string = fs.readFileSync(`${migrationsDir}/${migration}`, 'utf8')
        await client.query(fileContent)
        await client.query('INSERT INTO migrations(filename) VALUES ($1)', [migration])
        await client.query('COMMIT')
    } catch (err) {
        await client.query('ROLLBACK')
        throw err
    } finally {
        client.release()
    }
  }

  await pool.end()
} catch (err) {
  Sentry.captureException(err)
  await Sentry.flush(2000)
  throw err
}
