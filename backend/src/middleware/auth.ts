import type { FastifyRequest, FastifyReply } from 'fastify'
import { validateSession } from '../auth.js'

export async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
  const token = request.cookies.session

  if (!token) {
    reply.status(401).send({ error: 'Not authenticated' })
    return
  }

  const result = await validateSession(request.server.pg, token)

  if (!result) {
    reply.status(401).send({ error: 'Not authenticated' })
    return
  }

  request.user = result.user
}
