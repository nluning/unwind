  import pg from 'pg'

  const pool = new pg.Pool({
    host: 'localhost',
    port: 5555,
    user: 'unwind',
    password: 'unwind',
    database: 'unwind',
  })

pool.query('BEGIN')
pool.query('CREATE TABLE IF NOT EXISTS migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ DEFAULT now());')
pool.query('COMMIT')

  await pool.end()