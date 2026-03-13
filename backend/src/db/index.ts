import 'dotenv/config'
import { FastifyInstance } from 'fastify'
import fp from 'fastify-plugin'
import pg from "pg"

async function dbPlugin(fastify: FastifyInstance) {
    const pool = new pg.Pool({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    })

    await pool.query('SELECT NOW()')
    fastify.log.info('Connected to database')

    fastify.decorate('pg', pool)
}


const pool = fp(dbPlugin)

export default pool