# ADR Index

Quick reference for all Architecture Decision Records. Read the full ADR before
making changes in the listed area.

| ADR | Decision | Read before changing |
|-----|----------|---------------------|
| [001](ADR-001-monorepo-structure.md) | Single repo, separate `frontend/` and `backend/` with own `package.json` | project structure, deployment |
| [002](ADR-002-fastify-over-express.md) | Fastify for schema validation, plugin system, Pino logging | backend framework, middleware |
| [003](ADR-003-raw-sql-over-orm.md) | Raw SQL via `pg` with parameterized queries, no ORM | database queries, migrations |
| [004](ADR-004-oslo-session-auth.md) | Hand-written session auth with oslo crypto, httpOnly cookies | auth logic, middleware, cookies |
| [005](ADR-005-pwa-over-native.md) | PWA with service worker and IndexedDB | frontend deployment, offline |
| [006](ADR-006-claude-model-strategy.md) | Haiku for Mode 4 chat, Sonnet for onboarding | AI integration, prompts, cost |
| [007](ADR-007-offline-first-indexeddb.md) | Sync to IndexedDB, modes 1-3 read local, queue offline actions | frontend data layer, sync |
| [008](ADR-008-vps-over-managed-hosting.md) | Docker on Hetzner VPS, nginx, Let's Encrypt, GitHub Actions CI/CD | deployment, infrastructure |
| [009](ADR-009-categories-table-not-pg-enum.md) | Categories as a table with SERIAL IDs, not a PG enum | database schema, seed data |
| [010](ADR-010-i18n-activity-translations.md) | Slug-based i18n keys for activity content, fallback to English | frontend i18n, activity rendering |
| [011](ADR-011-node-over-laravel.md) | Node.js + Fastify + TypeScript, hand-built auth/migrations | backend stack |
| [012](ADR-012-device-first-auth.md) | Auto device-auth on first load; login/onboarding are opt-in menu actions, not gates | router boot, auth flows, onboarding removal, menu structure |
