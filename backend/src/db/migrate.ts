  import pg from 'pg'

  const pool = new pg.Pool({
    host: 'localhost',
    port: 5432,
    user: 'unwind',
    password: 'unwind',
    database: 'unwind',
  })


  
  // ... 

  await pool.end()