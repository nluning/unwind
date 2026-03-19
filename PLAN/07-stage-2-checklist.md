# Stage 2 — Authentication

## Goal

Make the app personal: each user gets their own activity list and usage history.
Build auth with session-based tokens, password hashing, and httpOnly cookies —
using small crypto libraries (`@oslojs/*`, `argon2`) but wiring the logic
yourself.

## Background: why not Lucia?

The plan originally specified Lucia, but it was deprecated in 2025. The author
turned lucia-auth.com into a guide on implementing auth yourself, using the
`@oslojs/*` packages for crypto primitives. This is actually a better fit for
our learning goals — you wire the session logic, the library handles the crypto
you should never write yourself.

**Before starting:** check lucia-auth.com and github.com/oslo-project to
confirm the packages below are still current.

---

## How to read this checklist

Each step is marked with one of three labels:

- **🔧 Try first** — attempt this yourself based on patterns from Stage 1.
  Give it ~10 minutes. If you're stuck (not confused about syntax, but confused
  about *what to do*), ask for help.
- **📖 Lookup** — syntax, library APIs, config. Use docs or AI freely. Don't
  spend time memorizing this.
- **🛑 Don't DIY** — crypto, hashing, token generation. Use the library. Never
  roll your own. Seriously.

---

## Part A: Throwaway JWT exercise (learning branch)

**Purpose:** understand how tokens work by building a bad version. This code
gets deleted — it's not secure enough for real users.

### Step 1: Create a throwaway branch

📖 `git checkout -b throwaway/jwt-auth`

### Step 2: Build a manual JWT flow

This is one file or a small set of files. No libraries except `jsonwebtoken`
(the npm package). Build:

1. **`POST /register`** — accepts `email` + `password`, hashes the password
   (use `bcrypt` here, it's fine for a throwaway), stores in `users` table,
   returns a JWT.

2. **`POST /login`** — accepts `email` + `password`, verifies against the
   hash, returns a JWT containing the user ID.

3. **Auth middleware** — a Fastify `onRequest` hook that reads the
   `Authorization: Bearer <token>` header, verifies the JWT, and attaches the
   user to the request. If invalid/expired, return 401.

4. **`GET /me`** — a protected route that returns the current user's info.
   Only works with a valid token.

🔧 **Try first:** the middleware hook and the `/me` route. You've already
written Fastify hooks (the db plugin uses `decorate`). A `preHandler` or
`onRequest` hook is the same pattern — it runs before the route handler. Try
writing the hook that reads the header and calls `jwt.verify()`.

📖 **Lookup:** `jsonwebtoken` API (`jwt.sign()`, `jwt.verify()`), bcrypt API.

🛑 **Don't DIY:** don't implement the actual JWT signing algorithm. Use the
`jsonwebtoken` package.

### Step 3: See it break

Try these things manually (Postman/Thunder Client):

- Call `/me` without a token → should get 401
- Call `/me` with an expired token → should get 401
- Call `/me` with a tampered token (change a character) → should get 401
- Call `/me` with a valid token → should get your user back

**What you should understand after this:**
- A JWT is three base64 parts: header, payload, signature
- The server verifies the signature — that's how it knows the token wasn't
  tampered with
- JWTs are stateless — the server doesn't store them. This means you can't
  truly "log out" without extra work (blacklists or short expiry + refresh)
- Why refresh tokens exist: short-lived access tokens + a longer-lived refresh
  token that can be revoked

### Step 4: Delete the branch

You've learned what you needed. `git checkout main` and move on.

---

## Part B: Production auth (on main)

This is the real implementation. Session-based (not JWT), database-backed,
with proper crypto.

### Step 5: Install dependencies

📖 These are the building blocks:

```bash
cd backend
npm install @oslojs/crypto @oslojs/encoding @fastify/cookie
npm install argon2
# or if argon2 has build issues on Windows: npm install @node-rs/argon2
```

**What each does:**
- `@oslojs/crypto` — SHA-256 for hashing session tokens (not passwords)
- `@oslojs/encoding` — hex encoding for the hashed token
- `@fastify/cookie` — read/set httpOnly cookies in Fastify
- `argon2` — password hashing (stronger than bcrypt, recommended standard)

### Step 6: Sessions table (migration)

🔧 **Try first.** You've written a migration before. This one adds a
`sessions` table:

```
sessions
  id              TEXT PRIMARY KEY  -- the SHA-256 hash of the session token
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL
  expires_at      TIMESTAMPTZ NOT NULL
  created_at      TIMESTAMPTZ DEFAULT now()
```

Create `backend/src/db/migrations/002_sessions.sql`.

**Why TEXT for id, not UUID?** Because the session ID is a SHA-256 hash (a hex
string), not a random UUID. You generate a random token, hash it, and store
the hash. The client holds the raw token; the database holds the hash. If
someone steals the database, they can't use the hashes to impersonate users.

### Step 7: Auth utility functions

Build a file `backend/src/auth.ts` with these functions. This is the core of
your auth system — small functions that you compose in routes and middleware.

**a) Password hashing** 🛑 Don't DIY — use the argon2 library.

```ts
import { hash, verify } from 'argon2'
// (or from '@node-rs/argon2' — same API)

export async function hashPassword(password: string): Promise<string> {
  return await hash(password)
}

export async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return await verify(hash, password)
}
```

These are thin wrappers. You might wonder why bother wrapping — it's so the
rest of your code imports from one place. If you ever switch from argon2 to
something else, you change one file.

**b) Session token generation** 🛑 Don't DIY the randomness.

```ts
import { sha256 } from '@oslojs/crypto/sha2'
import { encodeHexLowerCase } from '@oslojs/encoding'
import crypto from 'node:crypto'

export function generateSessionToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(20))
  // Encode as base64 for a compact, URL-safe string
  return Buffer.from(bytes).toString('base64url')
}

export function hashSessionToken(token: string): string {
  const encoded = new TextEncoder().encode(token)
  const hashed = sha256(encoded)
  return encodeHexLowerCase(hashed)
}
```

**c) Session CRUD** 🔧 Try first — this is raw SQL, which you've done.

```ts
export async function createSession(pg: Pool, userId: string, token: string) {
  const id = hashSessionToken(token)
  const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days
  await pg.query(
    'INSERT INTO sessions (id, user_id, expires_at) VALUES ($1, $2, $3)',
    [id, userId, expiresAt]
  )
  return { id, userId, expiresAt }
}

export async function validateSession(pg: Pool, token: string) {
  const id = hashSessionToken(token)
  const result = await pg.query(
    'SELECT s.*, u.id as uid, u.email FROM sessions s JOIN users u ON s.user_id = u.id WHERE s.id = $1',
    [id]
  )
  if (result.rows.length === 0) return null

  const session = result.rows[0]
  if (new Date(session.expires_at) < new Date()) {
    await pg.query('DELETE FROM sessions WHERE id = $1', [id])
    return null
  }

  // Sliding expiration: extend if more than halfway through
  const thirtyDays = 1000 * 60 * 60 * 24 * 30
  const halfLife = thirtyDays / 2
  if (new Date(session.expires_at).getTime() - Date.now() < halfLife) {
    const newExpiry = new Date(Date.now() + thirtyDays)
    await pg.query('UPDATE sessions SET expires_at = $1 WHERE id = $2', [newExpiry, id])
  }

  return { session, user: { id: session.uid, email: session.email } }
}

export async function invalidateSession(pg: Pool, token: string) {
  const id = hashSessionToken(token)
  await pg.query('DELETE FROM sessions WHERE id = $1', [id])
}
```

📖 The sliding expiration pattern is a lookup — you wouldn't invent this.
But **understand why it exists**: it keeps active users logged in without
giving infinite-lifetime tokens.

### Step 8: Auth middleware (Fastify hook)

🔧 **Try first.** You've built a Fastify plugin before (`db/index.ts`). This
one is a `preHandler` hook that validates the session cookie on protected
routes.

The approach:
1. Read the session token from the cookie (`request.cookies.session`)
2. Call `validateSession()` with it
3. If valid: attach the user to the request object (you'll need to extend
   Fastify's types, like you did for `fastify.pg`)
4. If invalid or missing: reply 401

📖 **Lookup:** `@fastify/cookie` API for reading cookies. Fastify's
`decorateRequest` for adding a `user` property to requests.

**How to apply it to routes:** don't make it global. Register it as a
`preHandler` on specific routes or use a Fastify plugin scope. The `/health`
endpoint shouldn't require auth.

### Step 9: Auth routes

Build `backend/src/routes/auth.ts` (this is a good time to start splitting
routes into separate files — the Stage 1 scalability notes predicted this).

**`POST /register`** 🔧 Try first for the route structure, 📖 lookup for
argon2 API.

1. Validate body: `email` (string, format: email) + `password` (string,
   minLength: 8). Use Fastify JSON Schema validation like you did for
   activities.
2. Check if email already exists → 409 Conflict
3. Hash the password with `hashPassword()`
4. Insert into `users` table
5. Generate a session token, create a session
6. Set the token as an httpOnly cookie
7. Return the user (without the password hash!)

**`POST /login`** 🔧 Try first.

1. Validate body: `email` + `password`
2. Look up user by email → 401 if not found (don't say "user not found" —
   that reveals which emails exist)
3. Verify password with `verifyPassword()` → 401 if wrong (same error message
   as above: "Invalid email or password")
4. Generate session token, create session, set cookie
5. Return the user

**`POST /logout`** 🔧 Try first — this is short.

1. Read session token from cookie
2. Call `invalidateSession()`
3. Clear the cookie
4. Return 200

**`GET /me`** 🔧 Try first — shortest route. Just return `request.user`
(which the auth middleware attached).

### Step 10: Protect activity routes

🔧 **Try first.** Add the auth middleware as a `preHandler` to the activity
routes. The `/health` endpoint stays public.

After this, all activity CRUD requires a valid session. Update the activity
queries to filter by `user_id` — a user should only see and modify their own
activities (plus base activities where `user_id IS NULL`).

### Step 11: Cookie configuration

📖 **Lookup** — these are security settings you look up, not invent:

```ts
reply.setCookie('session', token, {
  httpOnly: true,    // JavaScript can't read it (XSS protection)
  secure: true,      // only sent over HTTPS (set false for localhost)
  sameSite: 'lax',   // sent on same-site requests + top-level navigations
  path: '/',         // available on all routes
  maxAge: 60 * 60 * 24 * 30, // 30 days, matches session expiry
})
```

For local development, `secure` needs to be `false` (you're on HTTP, not
HTTPS). Use an environment variable to toggle this.

---

## Part C: Device-based auth (stretch — can defer)

This is for anonymous users who don't want to create an account. It's a nice
feature but not blocking for Stage 3. If you want to speed up, **skip this
for now** and come back after the core modes work.

### Step 12: Anonymous user flow

The idea: generate a random `device_id` on first visit, create a `users` row
with no email/password, and issue a session. The user gets a persistent
experience without signing up.

### Step 13: Account upgrade flow

An anonymous user can later add email + password to their account. Their
activities and usage history are preserved.

---

## Part D: Tests

### Step 14: Auth integration tests

🔧 **Try first** — you wrote solid tests in Stage 1. Same pattern, new domain.
Use `fastify.inject()` like before.

**Test file: `tests/auth.spec.ts`**

Minimum test cases:

```
Registration:
- registers a new user and returns 201 + sets a cookie
- returns 409 when email already exists
- returns 400 when email/password missing or invalid

Login:
- logs in with correct credentials and sets a cookie
- returns 401 with wrong password
- returns 401 with non-existent email
- same error message for wrong email vs. wrong password (security)

Session:
- GET /me with valid session returns user info
- GET /me without a cookie returns 401
- GET /me with expired session returns 401
- logout invalidates the session (GET /me after logout → 401)

Protected routes:
- GET /activities without auth returns 401
- GET /activities with auth returns 200
```

📖 **Lookup:** how to read `Set-Cookie` headers from `fastify.inject()`
responses and send them back in subsequent requests (the `set-cookie-parser`
package you already have can help, or just read the raw header).

### Step 15: Update existing activity tests

🔧 **Try first.** Your existing activity tests will break because the routes
now require auth. Update the test setup to:

1. Create a test user before each test (or in `beforeAll`)
2. Log them in and capture the session cookie
3. Send the cookie with every `inject()` call

This is a bit tedious but straightforward — it's the same test helpers
pattern, just with an extra step.

---

## Definition of done

- [ ] Throwaway JWT exercise done, branch deleted, you can explain how JWTs
      work and why you're not using them in production
- [ ] `POST /register` creates user, hashes password, returns session cookie
- [ ] `POST /login` verifies password, returns session cookie
- [ ] `POST /logout` invalidates session
- [ ] `GET /me` returns current user when authenticated
- [ ] Session middleware protects activity routes
- [ ] Activity routes filter by the logged-in user's ID
- [ ] Passwords are hashed with argon2 (never stored in plaintext)
- [ ] Session tokens are stored as SHA-256 hashes in the database
- [ ] Cookies are httpOnly, secure (in production), sameSite=lax
- [ ] Auth integration tests pass
- [ ] Existing activity tests still pass (updated to use auth)
- [ ] You can explain: how sessions work, why we hash the session token in the
      DB, why httpOnly cookies, what sliding expiration does
