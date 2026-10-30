
  import { buildApp } from '../../src/app.js'
  import type { FastifyInstance } from 'fastify'

  let app: FastifyInstance

  // These tests TRUNCATE users, activities, categories, ... on every run. If
  // .env.test is missing, the app silently falls back to .env (the dev database)
  // and wipes it. Refuse to touch any database that isn't clearly a test one.
  function assertTestDatabase() {
    const databaseName = process.env.DB_NAME ?? ''
    if (!databaseName.endsWith('_test')) {
      throw new Error(
        `Refusing to run integration tests against database "${databaseName}": ` +
        `they truncate tables, and only databases ending in "_test" are allowed. ` +
        `Create backend/.env.test (a copy of .env with DB_NAME=unwind_test) so the tests use a separate database.`
      )
    }
  }

  export async function getApp() {
    assertTestDatabase()
    if (!app) {
      app = await buildApp()
      await app.ready()
    }
    return app
  }

  export async function truncateAll(app: FastifyInstance) {
    assertTestDatabase()
    await app.pg.query(`
      TRUNCATE activities, activity_categories, usage_events, categories,
               user_memories, api_usage, users
      CASCADE
    `)
  }

  export async function closeApp() {
    if (app) {
      await app.close()
    }
  }