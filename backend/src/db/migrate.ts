import pg from 'pg'
import fs from 'fs'
import path from 'path'

const pool = new pg.Pool({
  host: 'localhost',
  port: 5555,
  user: 'unwind',
  password: 'unwind',
  database: 'unwind',
})

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
  } catch (e) {
      await client.query('ROLLBACK')
      throw e
  } finally {
      client.release()
  }
}

await pool.end()