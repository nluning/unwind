# Stage 1 — Database design & API foundations

## Goal

Build the data layer that everything else rests on: a PostgreSQL schema for
users, activities, and categories, a migration system to manage schema changes,
a seed script with a base activity list, and CRUD API endpoints — all tested.

---

## Steps

### Step 1: Migration runner

Build a minimal migration runner script (`backend/src/db/migrate.ts`):

- Reads `.sql` files from `backend/src/db/migrations/` in alphabetical order
- Creates a `migrations` table on first run to track which files have been applied
- Runs unapplied migrations inside a transaction
- npm script: `npm run migrate`

The runner is ~30-40 lines. It teaches you exactly what tools like Flyway or
node-pg-migrate do under the hood.

**What you learn:**
- How migration tracking works (a table that records applied migrations)
- Transactions: why you wrap schema changes in `BEGIN`/`COMMIT`
- Working with `pg` programmatically beyond simple queries

### Step 2: Database schema (first migration)

Write `001_initial_schema.sql` with these tables:

```
users
  id              UUID PRIMARY KEY (gen_random_uuid())
  email           TEXT UNIQUE (nullable — anonymous users don't have one)
  password_hash   TEXT (nullable — same reason)
  device_id       TEXT UNIQUE (nullable — account users don't need one)
  created_at      TIMESTAMPTZ DEFAULT now()
  updated_at      TIMESTAMPTZ DEFAULT now()

categories
  id              SERIAL PRIMARY KEY
  name            TEXT UNIQUE NOT NULL
  -- Only 3 values (Head, Hands, Heart) but a table is cleaner than an enum
  -- if you ever want to add more categories (see 01-app-concept.md future
  -- possibilities). Seed these in the migration itself.

activities
  id              UUID PRIMARY KEY (gen_random_uuid())
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE (nullable — base
                  activities have no owner)
  title           TEXT NOT NULL
  description     TEXT
  suggested_duration  INTEGER NOT NULL  -- minutes
  min_stress_level    INTEGER NOT NULL CHECK (1-5)
  max_stress_level    INTEGER NOT NULL CHECK (1-5, >= min)
  source          TEXT NOT NULL CHECK (IN 'base','user','ai')
  times_suggested INTEGER DEFAULT 0
  times_accepted  INTEGER DEFAULT 0
  times_skipped   INTEGER DEFAULT 0
  is_hidden       BOOLEAN DEFAULT false  -- "never suggest again"
  created_at      TIMESTAMPTZ DEFAULT now()

activity_categories
  activity_id     UUID REFERENCES activities(id) ON DELETE CASCADE
  category_id     INTEGER REFERENCES categories(id) ON DELETE CASCADE
  PRIMARY KEY (activity_id, category_id)

usage_events
  id              UUID PRIMARY KEY (gen_random_uuid())
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
  activity_id     UUID REFERENCES activities(id) ON DELETE CASCADE NOT NULL
  action          TEXT NOT NULL CHECK (IN 'suggested','accepted','skipped')
  mode            TEXT NOT NULL CHECK (IN 'mode1','mode2','mode3','mode4')
  stress_level_before   INTEGER CHECK (1-5, nullable)
  stress_level_after    INTEGER CHECK (1-5, nullable)
  created_at      TIMESTAMPTZ DEFAULT now()
```

**Design decisions to think about while writing the SQL:**
- `categories` as a table vs. enum: decided — using a table with integer IDs,
  not a PG enum. TypeScript enums in the codebase for type safety. See ADR-009.
- `usage_events.mode`: not in the original data model diagram, but useful to
  know which mode generated the event.
- `is_hidden` on activities: supports "never suggest this again" without
  deleting the activity (preserves usage history).
- UUIDs vs. serial IDs: UUIDs for user-facing entities (users, activities,
  events) are better for security (no enumeration) and offline ID generation
  later. Serial for categories is fine since they're internal.

**What you learn:**
- PostgreSQL data types: UUID, TIMESTAMPTZ, SERIAL, TEXT, INTEGER, BOOLEAN
- Constraints: PRIMARY KEY, FOREIGN KEY, CHECK, UNIQUE, NOT NULL, DEFAULT
- Referential integrity: ON DELETE CASCADE and what it means
- Many-to-many relationships via junction tables

### Step 3: Database connection as a Fastify plugin

Refactor the database connection in `server.ts` into a proper Fastify plugin:

- Create `backend/src/db/index.ts` that exports a Fastify plugin
- The plugin registers the `pg.Pool` on the Fastify instance (via `decorate`)
- Routes access the pool through `fastify.db` instead of a module-level variable
- Connection config comes from environment variables (with local defaults)

This is small but important: it's the Fastify way of sharing resources, and
it sets you up to inject a test database later.

**What you learn:**
- Fastify's plugin/decorator pattern (vs. Express's `app.locals` or middleware)
- Environment variable configuration
- Why dependency injection matters for testing

### Step 4: Seed script

Write `backend/src/db/seed.ts` that populates the base activity list.

- Inserts the 3 categories (Head, Hands, Heart)
- Inserts ~25 base activities with category assignments
- Only inserts activities with `source = 'base'` and `user_id = NULL`
- Idempotent: running it twice doesn't create duplicates (use ON CONFLICT)
- npm script: `npm run seed`

The activity list should be broad enough that modes 1-3 are usable out of the
box. Each activity needs: title, description, duration, stress range, and at
least one category.

See "Base activity list" at the bottom of this file for the starter set.

**What you learn:**
- INSERT with ON CONFLICT (upsert pattern)
- Scripting database operations
- Thinking about data design: what makes a good activity entry?

### Step 5: CRUD API endpoints

Build the activity endpoints. Start simple, expand as needed.

**Endpoints:**

```
GET    /activities           — list activities (with query filters)
GET    /activities/:id       — get one activity
POST   /activities           — create an activity
PUT    /activities/:id       — update an activity
DELETE /activities/:id       — delete an activity
```

**Filtering (query params on GET /activities):**
- `?category=Head` — filter by category
- `?stress=3` — filter by stress level (return activities where
  min_stress <= 3 AND max_stress >= 3)
- `?source=base` — filter by source
- Filters should be combinable: `?category=Hands&stress=4`

**For each endpoint:**
- Validate the request body/params using Fastify's JSON Schema validation
  (this is one of Fastify's strengths — use it)
- Return appropriate HTTP status codes (200, 201, 400, 404, 500)
- Return consistent error responses: `{ error: "message" }`

**Note:** These endpoints are unprotected for now. Auth comes in Stage 2.
For now, base activities (user_id = NULL) are what you're working with.

**What you learn:**
- REST API design: resource naming, HTTP methods and their semantics
- Request validation with JSON Schema (Fastify's built-in approach)
- SQL: SELECT with JOINs, WHERE with dynamic filters, INSERT, UPDATE, DELETE
- HTTP status codes and when to use which
- Query building: constructing WHERE clauses from optional query params

### Step 6: Integration tests

Write tests for every endpoint using Vitest + Supertest (or `fastify.inject`
which is built in and doesn't need Supertest):

- Test the happy path for each endpoint
- Test filtering: does `?category=Head` return only Head activities?
- Test validation: does POST with missing required fields return 400?
- Test 404: does GET /activities/:nonexistent return 404?
- Test the seed script: does it populate the expected number of activities?

**Test setup:**
- Use a separate test database (e.g., `unwind_test`)
- Run migrations before tests, truncate tables between tests
- Use `fastify.inject()` — it's Fastify's built-in way to test routes without
  starting a real HTTP server. No need for Supertest.

**What you learn:**
- Integration testing patterns for APIs
- Test database management (separate DB, setup/teardown)
- `fastify.inject()` — Fastify's testing approach
- Writing tests that actually catch bugs vs. tests that just exist

### Step 7: Deploy to VPS [skip for now]

- Deploy the updated backend with the database schema and API endpoints
- Run migrations on the production database
- Verify endpoints work via the public URL

---

## Base activity list

These are the ~25 base activities for the seed script. Each has a title,
short description, duration in minutes, stress range (min-max on 1-5 scale),
and categories.

**Head (cognitive/mental)**

| # | Title | Description | Min | Duration | Stress |
|---|-------|-------------|-----|----------|--------|
| 1 | Listen to a podcast episode | Pick something light — comedy, storytelling, or a topic you enjoy. Don't pick anything work-related. | 20 | Head | 1-4 |
| 2 | Do a crossword or word puzzle | A small puzzle that occupies your brain just enough. | 15 | Head | 1-3 |
| 3 | Read a chapter of a book | Fiction works best for switching off. Keep it to one chapter. | 25 | Head | 1-3 |
| 4 | Watch a short documentary | Something you're curious about but that has nothing to do with work. | 30 | Head | 1-4 |
| 5 | Write down three things that went well today | Not a gratitude journal — just a quick brain dump of what didn't suck. | 5 | Head | 2-5 |
| 6 | Organize one small digital space | Clean up one folder, one browser tab group, or one playlist. Just one. | 15 | Head | 1-3 |
| 7 | Learn five words in a new language | Use an app or a list. Five words, that's it. | 10 | Head | 1-3 |
| 8 | Play a simple strategy game | Something turn-based or low-pressure. Chess puzzle, Sudoku, a calm city builder. | 20 | Head | 1-3 |

**Hands (physical/creative)**

| # | Title | Description | Min | Duration | Stress |
|---|-------|-------------|-----|----------|--------|
| 9 | Go for a walk around the block | No destination, no podcast. Just walking and looking around. | 15 | Hands | 1-5 |
| 10 | Stretch for ten minutes | Focus on shoulders, neck, and back. Slow and deliberate. | 10 | Hands | 2-5 |
| 11 | Doodle or sketch something | No goal, no skill required. Scribble shapes, draw your coffee cup, whatever. | 15 | Hands | 1-4 |
| 12 | Tidy one surface in your home | One desk, one counter, one shelf. That's the whole task. | 10 | Hands | 1-4 |
| 13 | Cook or prepare a simple snack | Something hands-on: cut fruit, make toast with toppings, brew tea properly. | 15 | Hands | 1-4 |
| 14 | Water your plants | If you have them. Check the soil, water what needs it, remove dead leaves. | 10 | Hands | 1-5 |
| 15 | Do a short bodyweight workout | Ten minutes of squats, push-ups, and planks. Nothing fancy. | 10 | Hands | 1-4 |
| 16 | Dance to three songs | Close the door if you want. Move however feels good. | 10 | Hands | 1-5 |
| 17 | Take a shower or bath | Make it intentional — not just getting clean, but resetting. | 15 | Hands | 2-5 |

**Heart (social/emotional)**

| # | Title | Description | Min | Duration | Stress |
|---|-------|-------------|-----|----------|--------|
| 18 | Text someone you haven't talked to in a while | Not a deep conversation — just a "hey, thinking of you." | 5 | Heart | 1-3 |
| 19 | Play with a pet | If you have one. Full attention, no phone. | 15 | Heart | 1-5 |
| 20 | Watch a comfort show episode | Something you've seen before that makes you feel safe. One episode. | 25 | Heart | 2-5 |
| 21 | Listen to music that matches your mood | Not to change your mood — to validate it. Make it a deliberate 15 minutes. | 15 | Heart | 1-5 |
| 22 | Call or voice-note a friend | A real voice connection, even brief. | 10 | Heart | 1-3 |
| 23 | Write about how you're feeling | Not a journal practice — just get the current mess out of your head and onto paper. | 10 | Heart | 3-5 |
| 24 | Look through photos that make you happy | Old trips, pets, friends. Set a timer so you don't spiral into nostalgia. | 10 | Heart | 1-4 |
| 25 | Sit outside and do nothing | Literally nothing. Bench, step, balcony. Five minutes of sky. | 5 | Heart, Hands | 3-5 |

**Multi-category**

| # | Title | Description | Min | Duration | Stress |
|---|-------|-------------|-----|----------|--------|
| 26 | Do a guided breathing exercise | Four counts in, seven counts hold, eight counts out. Three rounds. | 5 | Head, Hands | 3-5 |
| 27 | Color in a coloring book | The adult kind, or the kids kind — doesn't matter. | 20 | Head, Hands | 1-4 |

---

## Definition of done

- Migration runner works: `npm run migrate` applies SQL files in order and
  tracks them.
- Database schema matches the design (tables, constraints, relationships).
- `npm run seed` populates 25+ base activities with categories.
- All CRUD endpoints work and return correct status codes.
- Filtering by category, stress level, and source works (and combines).
- Request validation rejects bad input with 400 responses.
- Integration tests pass for all endpoints.
- You can explain the schema design, why you chose each constraint, and how a
  request flows from the API to the database and back.
- (When ready) Deployed to VPS with migrations applied.
