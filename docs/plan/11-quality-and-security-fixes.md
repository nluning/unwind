# Quality & security fixes

**Status: not started.** This plan covers the seven Priority 1 + Priority 2
findings from the code-quality evaluation (see conversation log, 2026-04-28).
Priority 3 (component refactor) lives in `12-component-refactor.md`.

## What this document covers

The backend has solid fundamentals — parameterized SQL, Oslo session crypto,
hashed sessions, httpOnly cookies — but a handful of edge-case gaps that are
worth fixing before real users arrive. Nothing here is a five-alarm fire; most
items are "the kind of thing a security-conscious reviewer would flag in a
PR." The pattern across all of them: **trust the boundary, don't trust the
edges.** Schemas validate types but not lengths. Sessions are hashed but the
DB can race. Routes parameterize SQL but each one rolls its own error shape.

The plan is phased so you can stop after any phase with the system in a strictly
better state than before. Phases are roughly ordered by **risk reduced per
minute spent**, with the exception that phase 4 (error handler) is placed
before phase 5 because phase 5's cleanup benefits from the new shape.

---

## Phase 1 — Input length limits

**Why this matters:** Right now `POST /chat` accepts a `content` field with
no `maxLength`. A single message body can be megabytes. That body gets
forwarded to Anthropic, which charges by token. Your rate limiter caps
*requests per day*, not *tokens per day*, so a single user can burn the API
budget with one giant request that still counts as 1/70 against their quota.
Same shape for `/onboarding/generate` — the `interests` array has no
`maxItems`, and each string has no `maxLength`. They get joined into the
prompt verbatim.

This is the cheapest fix in the plan and the highest-leverage in cost terms.
Two schema edits.

### Steps

1. **`backend/src/routes/chat.ts:24`** — change `content: { type: 'string' }`
   to `content: { type: 'string', maxLength: 5000 }`.
   - 5000 chars ≈ ~1500 tokens of user input, comfortably above any natural
     message but well below "send the whole novel."
2. **`backend/src/routes/onboarding.ts:76-80`** — change the `interests` schema:
   ```ts
   interests: {
     type: 'array',
     items: { type: 'string', maxLength: 100 },
     minItems: 0,
     maxItems: 20,
   }
   ```
3. Verify Fastify returns a 400 when limits are exceeded. The default error
   handler does this — once phase 4 ships, your global handler should preserve
   the status code.
4. Add one test per route that posts a too-long body and asserts 400.

### Done when

- Both routes reject oversize input with 400.
- Tests cover the rejection path.
- No code change in handlers — schemas alone do the work.

---

## Phase 2 — Env validation hardening

**Why this matters:** `server.ts:4-7` checks `FRONTEND_URL` in production but
nothing else. If `DB_PASSWORD` is missing, the process starts cleanly and
fails on the first query — which in containerized prod looks like "the server
came up but every request 500s." Startup-time validation is the easiest
debugging gift you can give yourself at 11pm.

### Steps

1. Create `backend/src/config.ts` (or extend `server.ts`) with a `requireEnv`
   helper:
   ```ts
   function requireEnv(keys: string[]) {
     const missing = keys.filter((key) => !process.env[key])
     if (missing.length > 0) {
       console.error(`Missing required env vars: ${missing.join(', ')}`)
       process.exit(1)
     }
   }
   ```
2. List the required vars explicitly. At minimum:
   - `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
   - `ANTHROPIC_API_KEY`
   - `FRONTEND_URL` in production only
3. Run validation before `buildApp()` in `server.ts`.
4. Optional: validate format too (e.g. `DB_PORT` must parse as a positive
   integer, `FRONTEND_URL` must be a valid URL). Skip this if it adds more
   code than it saves debugging.

### Done when

- Removing any required var from `.env.example` and starting the server
  produces a single clear error and exits non-zero.
- `npm run dev` still starts cleanly with the existing `.env`.

---

## Phase 3 — Rate limiter atomicity

**Why this matters:** `middleware/rateLimit.ts:27-46` does count → check →
insert as three separate statements. Two concurrent requests can both pass
the count check and both insert, allowing a user to exceed the cap by ~2×
under concurrency. With a 70/day chat limit, this isn't a security issue —
it's a correctness issue. You said the limit is 70; you mean 70.

The fix is a single SQL statement that inserts only if the count is below the
cap.

### Steps

1. Replace the three queries in the middleware with one conditional insert:
   ```sql
   INSERT INTO api_usage (user_id, endpoint)
   SELECT $1, $2
   WHERE (
     SELECT COUNT(*) FROM api_usage
     WHERE user_id = $1 AND endpoint = $2 AND created_at >= $3
   ) < $4
   RETURNING id
   ```
   - The `WHERE` after `SELECT $1, $2` is the trick: if the count is at or
     above the cap, no row is selected to insert.
   - Postgres evaluates the subquery once per row, but here it's effectively
     once because `SELECT $1, $2` produces one row.
2. Check the returned rowcount. If zero, the user is over the limit — return
   429 as before.
3. Re-run the existing rate-limit tests to confirm behavior is unchanged in
   the non-racing case.
4. Add a concurrency test if you want to prove the fix: spawn N concurrent
   requests, assert no more than `maxRequests` succeed. (Optional — the SQL
   change is provably atomic at the statement level.)

### Done when

- The middleware is one query instead of three.
- Existing tests pass.
- `request.server.pg.query(...)` returns `rows: []` when over the limit.

### Tradeoff to think about

This is one of those places where an ORM would have given you `findOrCreate`
or similar and hidden the SQL. By writing the SQL yourself, you get to see
that "atomic insert-if" is a real concept and not magic. The cost is that
you have to reason about it.

---

## Phase 4 — Global error handler

**Why this matters:** Right now every route has its own `try/catch (err: any)`
with a different reply shape. `chat.ts` catches Anthropic errors and maps to
429/503. `onboarding.ts` does its own version with a different status mapping.
Validation errors fall through to Fastify's default handler, which returns a
slightly different shape again. A frontend that wants to show "the AI is
overloaded" needs to know three different ways the backend says it.

A single `setErrorHandler` solves all of this and lets you delete the per-route
catches.

### Steps

1. In `app.ts`, after registering plugins, add:
   ```ts
   fastify.setErrorHandler((error, request, reply) => {
     // Anthropic rate limit
     if (error.status === 429) return reply.code(429).send({ error: 'rate_limit' })
     // Anthropic overload / 5xx
     if (error.status === 503 || error.status === 529) return reply.code(503).send({ error: 'upstream_unavailable' })
     // Postgres unique violation
     if ((error as { code?: string }).code === '23505') return reply.code(409).send({ error: 'conflict' })
     // Validation
     if (error.validation) return reply.code(400).send({ error: 'invalid_request', details: error.validation })
     // Default
     fastify.log.error(error)
     return reply.code(500).send({ error: 'internal' })
   })
   ```
   - Tweak the error shape to match what the frontend already expects so this
     isn't a breaking change.
2. Walk every route handler and remove the now-redundant `try/catch` blocks.
   Re-throw instead of catching, or just don't catch.
3. Update tests — assertions on error shape may need to change. Keep them
   simple: status code + a stable `error` string code, no human-readable text
   the frontend would have to match against.

### Done when

- `chat.ts` and `onboarding.ts` no longer have their own try/catch for
  Anthropic errors.
- Validation, conflict, and upstream errors all return predictable shapes.
- All existing tests pass.

### Why this is phase 4 and not phase 1

It's a refactor, not a fix. None of phases 1-3 are easier with the global
handler in place, but phase 5 is — once you have the handler, the N+1 fix
doesn't have to worry about wrapping its own try/catch.

---

## Phase 5 — Onboarding N+1 → batch insert

**Why this matters:** `onboarding.ts:160-198` runs:

- 1 INSERT per activity (×~12)
- 1 INSERT per category link (×~12)
- 1 INSERT per memory (×~5)

That's ~30 round-trips to Postgres for one onboarding call, all wrapped in a
transaction. Each round-trip is a few ms locally, ~10-50ms over a network in
production. Total: 0.3-1.5s spent on inserts alone, on top of the Claude API
call. The user is staring at a "generating…" spinner, so this is felt.

This is the textbook case where raw SQL is a feature, not a burden — multi-row
`VALUES` collapses 30 statements to 3.

### Steps

1. **Activities**: build one `INSERT ... VALUES ($1,$2,...), ($n+1,...) RETURNING id, ...`.
   ```ts
   const valuesSql = result.activities
     .map((_, i) => `($${i*6+1}, $${i*6+2}, $${i*6+3}, $${i*6+4}, $${i*6+5}, 'ai', $${i*6+6})`)
     .join(', ')
   const params = result.activities.flatMap((a) => [
     a.title, a.description ?? null, a.duration_minutes,
     a.min_stress, a.max_stress, userId,
   ])
   const inserted = await dbClient.query<{ id: string }>(
     `INSERT INTO activities (title, description, suggested_duration, min_stress_level, max_stress_level, source, user_id)
      VALUES ${valuesSql} RETURNING id`,
     params
   )
   ```
2. **Category links**: pair each returned activity ID with its category, then
   build a second multi-row INSERT. Skip pairs where the category isn't
   recognized — log a warning, same behavior as today.
3. **Memories**: same pattern, gated on consent.
4. The whole thing stays inside the existing `BEGIN`/`COMMIT`/`ROLLBACK`.
5. Add a test that posts onboarding input and asserts the right number of
   activities and categories ended up in the DB.

### Done when

- Three queries in the transaction instead of ~30.
- Test confirms the inserted shape is identical to today.
- Manual onboarding feels noticeably snappier.

### Concept worth understanding

Building parametrized multi-row VALUES strings is the one place where raw-SQL
hurts vs. an ORM. Many projects write a small helper like
`buildInsertValues(rows, columnCount)` that returns `{ sql, params }`. Once
you've done it twice, you'll want one. Don't write it preemptively.

---

## Phase 6 — Reorganize `routes.ts`

**Why this matters:** Six route modules, five of them in `routes/` (auth,
chat, memory, onboarding, etc.), one in `routes.ts` at the top level
(activities). New contributors hunting for `GET /activities` look in the
folder first and waste a minute. Cheapest possible cleanup.

### Steps

1. Rename `backend/src/routes.ts` → `backend/src/routes/activities.ts`.
2. Rename the exported function from `activityRoutes` (if that's still its
   name) to match the convention used by the other modules.
3. Update the import in `app.ts`.
4. Run tests, run dev server, smoke-test one activities endpoint.

### Done when

- All route files live in `backend/src/routes/`.
- No file at the path `backend/src/routes.ts`.

---

## Phase 7 — Email-upgrade race graceful failure

**Why this matters:** `auth.ts:201-238` has a TOCTOU between the
"is this email taken" check and the UPDATE. The DB has `email TEXT UNIQUE`
(verified — `migrations/001_initial_schema.sql:3`), so concurrent upgrades
can't both succeed; one will fail with Postgres error code `23505`. But
right now you don't catch that, so the loser of the race gets a 500 instead
of a clean 409.

If you're doing phase 4 first, this fix is *already done*: the global error
handler catches `23505` and returns 409. So this phase is just verifying
that — but only if phase 4 is done.

### Steps

1. **If phase 4 is done:** add a test that simulates two concurrent upgrades
   to the same email and asserts the loser gets 409. Confirm the global
   handler does the right thing. Done.
2. **If phase 4 is skipped:** add a local try/catch in the upgrade handler:
   ```ts
   try {
     const result = await fastify.pg.query('UPDATE ...', [...])
     return reply.code(200).send(result.rows[0])
   } catch (err) {
     if ((err as { code?: string }).code === '23505') {
       return reply.code(409).send({ error: 'Email already registered' })
     }
     throw err
   }
   ```
3. Optional: also remove the pre-check on email-taken — the DB's UNIQUE
   constraint is the real guard, and the pre-check just adds a query that
   can't ever be authoritative under concurrency. Make the UPDATE the only
   gate.

### Done when

- Two simultaneous upgrades to the same email: one succeeds, the other gets
  409 with a clear error string.

---

## Order summary

| Phase | What | Risk reduced | Time |
|-------|------|--------------|------|
| 1 | Input length limits | Token-cost DoS, prompt injection size | ~30 min |
| 2 | Env validation | Hard-to-debug startup failures | ~30 min |
| 3 | Rate limiter atomic | Bypass under concurrency | ~30 min |
| 4 | Global error handler | Inconsistent error shapes | ~60 min |
| 5 | Onboarding N+1 | UX (slow generate); learning | ~60 min |
| 6 | Move `routes.ts` | Discoverability | ~10 min |
| 7 | Upgrade race graceful | Ungraceful 500 → clean 409 | ~15 min |

Total: roughly half a day of focused work. None of it is research-heavy;
each phase is a known shape.
