
  import { buildApp } from '../src/app.js'
  import type { FastifyInstance } from 'fastify'

  let app: FastifyInstance

  export async function getApp() {
    if (!app) {
      app = await buildApp()
      await app.ready()
    }
    return app
  }

  export async function truncateAll(app: FastifyInstance) {
    await app.pg.query(`
      TRUNCATE activities, activity_categories, usage_events, categories, users
      CASCADE
    `)
  }

  export async function closeApp() {
    if (app) {
      await app.close()
    }
  }