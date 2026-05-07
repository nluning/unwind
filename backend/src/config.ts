const ALWAYS_REQUIRED = [
  'DB_HOST',
  'DB_PORT',
  'DB_USER',
  'DB_PASSWORD',
  'DB_NAME',
] as string[]

const PRODUCTION_ONLY = [
  'FRONTEND_URL',
  'ANTHROPIC_API_KEY',
  'SENTRY_DSN',
] as string[]

export function validateEnv() {
  const required = [...ALWAYS_REQUIRED]
  if (process.env.NODE_ENV === 'production') {
    required.push(...PRODUCTION_ONLY)
  }

  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error(`Missing required env vars: ${missing.join(', ')}`)
    process.exit(1)
  }

  // pg.Pool silently accepts NaN as a port and only fails on connect — catch it here.
  const port = Number(process.env.DB_PORT)
  if (!Number.isInteger(port) || port <= 0) {
    console.error(`DB_PORT must be a positive integer (got "${process.env.DB_PORT}")`)
    process.exit(1)
  }
}
