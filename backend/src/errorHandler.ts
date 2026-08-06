import type { FastifyError, FastifyReply, FastifyRequest, FastifyInstance } from 'fastify'
import * as Sentry from '@sentry/node'

interface AnthropicLikeError extends Error {
  status?: number
}

interface PgLikeError extends Error {
  code?: string
}

export function registerErrorHandler(fastify: FastifyInstance) {
  fastify.setErrorHandler((error: FastifyError, _request: FastifyRequest, reply: FastifyReply) => {
    const upstream = error as AnthropicLikeError
    if (upstream.status === 429) {
      return reply.code(429).send({ error: 'AI service is busy. Try again in a moment.' })
    }
    if (upstream.status === 503 || upstream.status === 529) {
      fastify.log.error({ err: error }, 'Anthropic upstream error')
      Sentry.captureException(error)
      return reply.code(503).send({ error: 'AI service is temporarily unavailable.' })
    }
    if (upstream.status === 400 && /credit balance/i.test(error.message)) {
      fastify.log.error({ err: error }, 'Anthropic credit balance exhausted')
      Sentry.captureException(error, { tags: { anthropic_error: 'credit_balance' } })
      return reply.code(503).send({ error: 'AI service is temporarily unavailable.' })
    }

    if ((error as PgLikeError).code === '23505') {
      return reply.code(409).send({ error: 'A record with this value already exists.' })
    }

    if (error.validation) {
      return reply.code(400).send({ error: error.message })
    }

    if (error.statusCode && error.statusCode < 500) {
      return reply.code(error.statusCode).send({ error: error.message })
    }

    fastify.log.error({ err: error }, 'Unhandled error')
    Sentry.captureException(error)
    return reply.code(500).send({ error: 'Internal server error.' })
  })
}
