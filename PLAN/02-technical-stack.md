# Unwind — Technical Stack & Rationale

## Overview

| Layer      | Choice                           | Familiar? |
| ---------- | -------------------------------- | --------- |
| Frontend   | Vue 3 + Vite, as PWA             | Yes       |
| Backend    | Node.js + Fastify in TypeScript  | Partially |
| Database   | PostgreSQL                       | New       |
| AI         | Anthropic Claude API             | New       |
| Auth       | Lucia (lightweight auth library) | New       |
| CSS        | UnoCSS (utility-first)           | Yes       |
| Testing    | Vitest                           | Yes       |
| Deployment | Docker on a VPS                  | New       |
| CI/CD      | GitHub Actions                   | New       |

The guiding principle: **two familiar anchors (Vue + Vitest), everything else stretches into
new territory.** This maximizes learning without removing all footing.

## Architecture overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User's phone                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Vue 3 PWA (installed)                  |    │
│  │                                                     │    │
│  │  ┌──────────────┐    ┌───────────────────────────┐  │    │
│  │  │  Vue UI      │    │  IndexedDB (local copy)   │  │    │
│  │  │  - modes 1-4 │    │  - activity list          │  │    │
│  │  │  - themes    │    │  - pending sync queue     │  │    │
│  │  │  - i18n      │    │  - auth tokens            │  │    │
│  │  └──────┬───────┘    └───────────┬───────────────┘  │    │
│  │         │                        │                  │    │
│  │         │   offline: use local   │                  │    │
│  │         │◄───────────────────────┘                  │    │
│  │         │                                           │    │
│  └─────────┼───────────────────────────────────────────┘    │
│            │ online: API calls                              │
└────────────┼────────────────────────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────────────────────────┐
│                    VPS (Docker)                             │
│                                                             │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────┐   │
│  │  Nginx   │───▶│  Fastify API     │───▶│ PostgreSQL  │  │
│  │  (HTTPS) │    │  (TypeScript)    │    │              │  │
│  │          │    │                  │    │ - users      │  │
│  └──────────┘    │  - auth (Lucia)  │    │ - activities │  │
│                  │  - activity CRUD │    │ - categories │  │
│                  │  - mode logic    │    │ - usage logs │  │
│                  │  - AI proxy      │    └──────────────┘  │
│                  └────────┬─────────┘                       │
│                           │                                 │
└───────────────────────────┼─────────────────────────────────┘
                            │ API calls (server-side only)
                            ▼
                  ┌──────────────────┐
                  │  Claude API      │
                  │  (Anthropic)     │
                  │                  │
                  │  - onboarding    │
                  │  - mode 4 chat   │
                  │  - list expansion│
                  └──────────────────┘
```

The key insight: **modes 1-3 work entirely from local data** (no server needed).
Only mode 4 (AI chat), syncing, and auth require a connection. This is what makes
offline support possible and the app feel fast.

## Frontend: Vue 3 + Vite as PWA

### Why Vue

- Noor already knows Vue and it's the framework used at the traineeship company.
- Keeping the frontend familiar frees up mental bandwidth for learning the backend,
  deployment, and AI integration — which are the primary learning goals.
- Vue 3's Composition API is modern and transferable in concepts to React hooks.

### Why not React

React is more in-demand in the Dutch job market. That's a real consideration. But
learning React _and_ a new backend _and_ deployment _and_ AI integration in one
project is too many unknowns at once. The architecture concepts learned here
(component design, state management, API communication, offline-first patterns)
transfer directly to React. Picking up React as a second framework later — once
the underlying concepts are solid — is a much smaller leap than it seems.

A React version of the frontend is planned as a focused follow-up exercise after
the core app is complete (see learning plan, Stage 8). This is deliberate
broadening, not a correction.

### Why not Nuxt

Nuxt (Vue's full-stack framework) adds SSR, file-based routing, and server-side
logic. It's powerful, but it's also a layer of abstraction. For learning purposes,
it's more valuable to set up the frontend and backend as separate concerns and
understand how they communicate. Nuxt can come later.

### Why PWA (not native)

A Progressive Web App with a service worker provides:

- Installable on the phone home screen (looks and feels like an app)
- Offline support for modes 1-3
- No App Store deployment process (which is slow and costs $99/year for iOS)
- One codebase for web and mobile

For this app's interaction pattern (open → tap → read suggestion → close), a
well-built PWA is indistinguishable from a native app. The things PWA can't do
(health APIs, reliable background tasks on iOS) only become relevant if/when the
energy tracking integration happens. At that point, the Vue frontend can be wrapped
in Capacitor to go native without a rewrite.

**Tradeoff to be honest about:** PWA on iOS has real limitations. Safari kills
service workers aggressively in the background, which can make offline sync queues
unreliable. iOS PWAs installed to the home screen use a separate storage context
from Safari, which can cause subtle auth issues. Push notifications on iOS PWA
require the user to "Add to Home Screen" first and then opt in — high friction.

Given that ~30% of Dutch smartphone users are on iOS, this is not a niche concern.
The mitigation plan: include an explicit iOS testing checkpoint during the PWA
stage, test auth and offline flows on a real iOS device (not just Android/Chrome),
and document known limitations for users. If iOS issues prove too frustrating,
Capacitor is the escape hatch — it keeps the Vue codebase and produces a real
native app.

## Backend: Node.js + Fastify in TypeScript

### Why Node.js instead of Laravel

This is the most deliberate learning choice in the stack. Noor already knows
Laravel, which means building another Laravel API would reinforce existing skills
but not teach much new.

Laravel gives you a lot "for free": auth scaffolding, ORM, validation, queue
management, migrations. That's great for productivity, but it hides _how_ these
things work. Building an API in Node.js forces you to:

- Understand HTTP request/response handling from scratch
- Implement authentication with an understanding of the full flow
- Write database queries more intentionally (less ORM magic)
- Structure an API project without a framework dictating the folder layout

These are the skills that transfer to any language or framework. A developer who
has built auth with awareness of the full flow understands what Laravel Sanctum
does under the hood — and can debug it when it breaks.

### Why TypeScript

- Noor already knows TypeScript.
- Full-stack TypeScript means one language across the entire codebase.
- TypeScript catches bugs at compile time that JavaScript misses, which is
  especially helpful when working solo.
- It's an industry expectation at this point.

### Why a framework at all (not raw Node.js `http`)

Node's built-in `http.createServer()` can do everything Fastify does — but you'd
spend your first days writing a router and a JSON body parser. Those are solved
problems that teach very little. Fastify is a *thin* convenience layer, not a full
framework like Laravel: it gives you routing, JSON parsing, schema validation, and
logging. There's no ORM, no auth, no migrations — you build all of that yourself.

The interesting learning is in application-level problems (database design, auth,
offline sync, AI integration), not in parsing HTTP request bodies. Fastify handles
the boring parts so you can focus on the parts that matter.

To build intuition for what Fastify replaces, there's a throwaway exercise: build
a tiny server with raw `http.createServer()` (see `PLAN/06-throwaway-raw-http.md`).
Do it once, understand it, then move on.

### Why Fastify (not Express)

Express is the most commonly taught Node.js framework, but it has not had a major
release since 2014 (Express 4). Express 5 has been in beta for years. The ecosystem
is stagnating.

Fastify is the better choice for a new project in 2026:

- **Built-in JSON schema validation** (using Ajv) that enforces request/response
  types at runtime. For a TypeScript project, this catches mismatches between
  compile-time types and actual runtime data — something Express doesn't do.
- **Plugin system** that is better designed than Express middleware, avoiding
  subtle ordering bugs.
- **Pino logging built in** — structured logging from the start, which matters
  for debugging in production.
- **Active development** with a clear roadmap.
- The learning curve is comparable to Express. The documentation is good. The
  "more Stack Overflow answers for Express" argument is shrinking and not
  sufficient reason to choose a stagnating framework.

**Tradeoff to be honest about:** building from scratch is slower than using
Laravel. Features that take 10 minutes in Laravel might take an hour or more.
That's the point — but it means the project timeline is longer. It's important to
recognize when "I should build this myself to learn" crosses into "I should use
a library because this is a solved problem" (e.g., password hashing — use bcrypt,
don't roll your own).

## Database: PostgreSQL

### Why not MySQL

Noor already knows MySQL. PostgreSQL is the industry standard for new projects,
offers better JSON support (useful for flexible activity metadata), and is what
most Node.js tutorials and tools assume.

In practice, the switch from MySQL to PostgreSQL is small — the SQL is 95%
identical. The bigger learning is in designing a good schema, writing migrations,
and understanding indexing — all of which transfer across any relational database.

### Why not a NoSQL option (MongoDB, etc.)

The data model for this app is clearly relational: users have activities, activities
have categories, usage events reference both users and activities. A relational
database is the right tool. Using NoSQL here would mean fighting the data model
to fit a document structure, which teaches the wrong lessons.

### Database access: raw SQL with `pg`

Use the `pg` package directly with raw SQL queries — no ORM, no query builder.
The goal is to learn SQL, and a query builder like Knex teaches its own API rather
than SQL itself. For migrations, use numbered raw SQL files with a simple runner
script. This is more transparent than a migration framework and teaches exactly
what's happening to the database.

## AI: Anthropic Claude API (server-side)

### Why an LLM at all

Modes 1-3 don't need AI — they're filtering and randomization. But the app's
AI features are genuinely useful:

- **Onboarding**: generating a personalized starter list of activities based on a
  conversation about the user's interests, constraints, and preferences.
- **Mode 4**: an interactive conversation that helps users discover what they need
  when they can't articulate it themselves.
- **List expansion**: suggesting new activities based on patterns in what the user
  accepts/skips.

### Why Claude specifically

- Noor is already using Claude as a development tool, so there's familiarity.
- Claude's API is straightforward to integrate.
- The system prompt approach (giving the model a role and constraints per mode)
  maps well to this app's needs.
- **Use Claude Haiku for Mode 4 conversations** — it's significantly cheaper than
  Sonnet/Opus and the quality difference is negligible for guided yes/no
  conversations. Reserve larger models for onboarding (where output quality
  matters more).

### Privacy approach

The LLM should receive the minimum context needed:

- For onboarding: user's stated preferences and interests (no identifying info)
- For mode 4: current stress level, categories to avoid, a few recent suggestions
  — not the user's full history. Cap conversation context to the last 4 exchanges.
- Never: user IDs, email addresses, or raw behavioral data

All LLM calls go through the backend — the API key is never exposed to the client.

### AI onboarding: prototype first

The onboarding conversation is expected to generate a personalized starter list in
under 6 exchanges. Before committing to this as the primary onboarding method,
prototype it: test whether 6 constrained exchanges actually produce meaningfully
different lists for meaningfully different users. If the output is too generic, a
structured onboarding form (pick your interests, pick your constraints) may serve
the user better than a constrained chatbot. The AI can still enrich the results.

**Tradeoff to be honest about:** LLM API calls cost money and add latency. For
~100 users with moderate usage, costs should be low (estimate: under 10 EUR/month
using Haiku for Mode 4). But it's important to implement basic cost controls:
cache common responses, set per-user rate limits, keep conversation contexts short.

## Auth: Lucia (lightweight library) + device-based option

### Why Lucia instead of fully custom

Authentication is one of the most important things a web developer can understand.
The original plan proposed building JWT auth entirely from scratch. After review,
this creates too much security risk for an app with real users — even ~100 of them.

[Lucia](https://lucia-auth.com/) is a small, unopinionated TypeScript auth library
that handles session management and crypto primitives correctly without hiding the
mechanics. You still write the middleware, handle the token storage, and understand
every step — but the crypto parts (hashing, token generation, session validation)
are done safely.

**Learning approach:** build a throwaway JWT prototype in a learning branch to
understand how tokens, refresh flows, and middleware work from scratch. Then use
Lucia for the actual app. This gives you the deep understanding _and_ the security.

### Why also support device-based

Some users won't want to create an account just to try an app. A device-based
mode (anonymous user with a device ID) lowers the barrier. Their data stays local
and syncs to a server-side anonymous profile. They can "upgrade" to a full account
later by adding email/password, linking their existing data.

### Token storage

Use httpOnly cookies for refresh tokens (not localStorage) — this protects against
XSS attacks. Access tokens can be kept in memory. This is slightly more complex
to implement in a PWA context but significantly more secure.

## CSS: UnoCSS

Utility-first CSS engine, similar to Tailwind but built for Vite. Noor has prior
experience with it. Chosen over:

- **Vanilla CSS / custom properties** — would work for theming but leads to
  duplicated layout CSS across components.
- **Tailwind** — more widely adopted but heavier setup, and CSS fundamentals
  aren't a priority for this project's learning goals.

UnoCSS handles the utility layer. Theme switching (calm/warm/playful presets)
will use CSS custom properties defined in UnoCSS's theme config.

## Testing: Vitest

Noor already has experience with Vitest — this is a strength to lean on, not defer.
Testing is integrated into every stage from Stage 1 onward:

- **Backend:** API integration tests using Vitest + Supertest
- **Frontend:** component and composable tests using Vitest + Vue Test Utils
- **Auth:** dedicated integration tests for the full token lifecycle (Stage 2)
- **Filtering logic:** unit tests for the mode 1-3 query/filter logic (Stage 3)

Testing is not a separate stage — it's part of how each feature is built.

## Deployment: Docker on a VPS

### Why Docker

Containerization is an essential skill. Docker lets you:

- Define your entire environment in code (Dockerfile, docker-compose)
- Run the same setup locally and in production
- Deploy reproducibly — no "works on my machine" problems

### Why a VPS (not Vercel/Railway/Heroku)

Managed platforms are convenient but hide what's actually happening. For learning,
it's more valuable to:

- Set up a Linux server (even a small one — Hetzner at ~4 EUR/month, with a Dutch data center)
- Install Docker, configure nginx as a reverse proxy, set up HTTPS with Let's
  Encrypt
- Understand what a port is, what a process is, what happens when you deploy

This is the kind of DevOps knowledge that makes junior developers stand out. Most
juniors can build a feature; fewer can explain how it gets from their laptop to
a user's phone.

### Deploy early, not late

The deployment stage appears late in the learning plan (Stage 6), but a minimal
"hello world" is deployed to the VPS at the end of Stage 0. This means server
issues (networking, HTTPS, firewall) are discovered early, and each subsequent
stage is deployed incrementally rather than all at once.

### CI/CD: GitHub Actions

Automate testing and deployment on every push. A simple pipeline:

1. Push to main → run tests → build Docker image → deploy to VPS.

This is a standard industry setup and worth learning early.

**Tradeoff to be honest about:** managing your own server is more work than a
managed platform. Things break (disk full, process crashes, SSL certificate
expires). That's real-world experience, but it's also real-world frustration.
Having a supervisor or colleague who can help debug server issues is valuable.

## Error tracking: Sentry

Add [Sentry](https://sentry.io/) (free tier) during the deployment stage. It
costs nothing at this scale and catches errors you'd otherwise never know about.
For ~100 users, `console.log` debugging is not sustainable — you need to know
when something breaks in production without users reporting it.

## Documentation

### What to document

- **README**: what is this, why was it built, the stack, how to run locally,
  a screenshot or two, a live demo link
- **Architecture Decision Records (ADRs)**: one short markdown file per major
  decision ("why Fastify over Express", "why Lucia over custom auth"). A few
  paragraphs each. This is a practice used at many Dutch companies and
  demonstrates thinking about _why_, not just _what_.
- **API documentation**: a simple list of endpoints, methods, and expected
  payloads. Essential if the energy-tracking app needs to integrate later.

### What NOT to document

- JSDoc on every function
- A wiki
- Detailed setup guides beyond the README
- Anything that duplicates what the code already says

## What this stack does NOT include (and why)

- **State management library (Pinia/Vuex)**: start without one. Use Vue's built-in
  reactivity and composables. Add Pinia only if state management becomes painful.
- **ORM (Prisma, TypeORM)**: start with raw SQL via `pg`. Understand what queries
  you're running before adding abstraction.
- **Query builder (Knex)**: teaches its own API rather than SQL. Use raw SQL and
  learn the real thing.
- **Monitoring/logging beyond Sentry**: Fastify includes Pino for structured
  logging. Sentry catches errors. That's enough at this scale.
