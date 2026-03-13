import 'dotenv/config'
import pg from 'pg'
import fs from 'fs'
import path from 'path'

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
await pool.end()
