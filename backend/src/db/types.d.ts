  import { Pool } from 'pg'

  declare module 'fastify' {
    interface FastifyInstance {
      pg: Pool
    }
    interface FastifyRequest {
      user?: { id: string; email: string | null }
    }
  }