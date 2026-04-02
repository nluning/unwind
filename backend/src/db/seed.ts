import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'
import { hash } from '@node-rs/argon2'

const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
})

const sql = fs.readFileSync(path.join(import.meta.dirname, 'seed.sql'), 'utf8')
await pool.query(sql)
console.log('Seed data inserted')

// Dev seed user — password is hashed at runtime so Argon2 verification works
const passwordHash = await hash('TestWachtwoord123')
await pool.query(
  `INSERT INTO users (email, password_hash) VALUES ($1, $2) ON CONFLICT (email) DO NOTHING`,
  ['example-user@example.com', passwordHash]
)
console.log('Dev seed user created (example-user@example.com / TestWachtwoord123)')

await pool.end()
