  import Fastify from 'fastify'
  import cors from '@fastify/cors'
  import dbPlugin from './db/index.js'
  import activityRoutes from './routes.js'

  export async function buildApp() {
    const fastify = Fastify({ logger: false }) 
    
    await fastify.register(cors, {})
    await fastify.register(dbPlugin)
    await fastify.register(activityRoutes)

    return fastify
  }