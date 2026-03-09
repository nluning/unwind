import Fastify from 'fastify'
import cors from '@fastify/cors'
import pg from 'pg'

const fastify = Fastify({logger:true}
)

await fastify.register(cors, {})

const pool = new pg.Pool({
    host: 'localhost',
    port: 5555,
    user: 'unwind',
    password: 'unwind',
    database: 'unwind',
})

fastify.get('/health', function (request, reply) {
    reply.send({ status: 'ok'})
})
  try {                                                                                                                         await pool.query('SELECT NOW()')                                                                                        
    fastify.log.info('Connected to database')                                                                               
  } catch (err) { 
    fastify.log.error(err, 'Failed to connect to database')
  }
fastify.listen({port: 3000}, function (err, address) {
    if (err) {
        fastify.log.error(err)
        process.exit(1)
    }
})