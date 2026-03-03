# Unwind — Learning & Build Plan

## A note for supervisors

This plan is designed to maximize learning of transferable skills: API design,
database modeling, authentication, offline-first architecture, AI integration,
containerization, and deployment. These are the skills that remain valuable
regardless of which framework is popular next year.

The stack deliberately avoids the comfortable path (another Laravel app) in favor
of building with less scaffolding. This is slower but produces deeper understanding.
The one familiar anchor (Vue) prevents the project from becoming overwhelming.

The project is scoped for a solo developer with no hard deadline. Each stage is
independent enough that the project is useful even if not all stages are completed.
A working app after Stage 3 is already a solid portfolio piece; stages 4-7 add
progressively more impressive skills.

Potential risks and mitigations:
- **Scope creep**: the stage structure helps. Each stage has a clear "done."
  Resist adding features that belong in a later stage.
- **Getting stuck on deployment/DevOps**: mitigated by deploying a minimal version
  in Stage 0 instead of saving it all for Stage 6. Having a colleague or supervisor
  available to help debug server issues is still recommended.
- **Over-engineering**: at ~100 users, simple solutions are correct. No
  microservices, no Kubernetes, no message queues. If it feels like enterprise
  architecture, it's too much. Note: ~100 users is an assumption, not a projection.
  If the app grows beyond that, the first things that need attention are logging,
  rate limiting, and error tracking — all of which are in the plan.
- **AI costs**: at this scale, costs should stay under 10 EUR/month (using Haiku
  for Mode 4). Set hard limits in the code to prevent surprises.
- **Security of custom auth**: mitigated by using Lucia (a lightweight auth library)
  for the real app, while building a throwaway manual JWT implementation as a
  learning exercise.

---

## How to read this document

This plan is organized in stages. Each stage results in something that works —
a running piece of the app that can be demonstrated and tested. This is deliberate:
shipping something small and real teaches more than planning something big and
theoretical.

Each stage lists:
- **Why this stage matters** — how it fits into the whole picture
- **What you build** — the concrete output
- **What you learn** — the transferable skills and concepts
- **Tests** — what to test and how
- **When to use AI assistance vs. figure it out yourself** — guidelines for
  productive learning (relevant in an era of AI-assisted development)
- **Definition of done** — how to know the stage is complete

Estimated effort per stage is intentionally omitted. Learning speed varies, and
artificial deadlines on a learning project create the wrong incentives.

---

## Stage 0 — Project setup, architecture understanding & first deployment

### Why this stage matters
Before writing a single feature, you need to see the whole system working
end-to-end — even if it does nothing useful yet. This stage gives you the mental
map: frontend talks to backend, backend talks to database, the whole thing runs
in Docker, and it's live on a real server. Every subsequent stage fills in a part
of this map.

### What you build
- A project repository with a clear folder structure (monorepo: `/frontend` and
  `/backend`)
- A `docker-compose.yml` that runs PostgreSQL locally
- A basic Fastify server in TypeScript that responds to `GET /health`
- A basic Vue 3 + Vite app that shows "Hello World" with data from the API
- Both running locally, frontend talking to backend
- **A minimal deployment to a VPS**: the health-check endpoint and a static
  frontend, live on a real server with HTTPS

### What you learn
- **Project structure**: how to organize a full-stack monorepo
- **Docker basics**: what a container is, what `docker-compose up` does, how to
  run PostgreSQL without installing it on your machine
- **TypeScript project setup**: `tsconfig.json`, compilation, running TS in Node
- **The HTTP request lifecycle**: what happens when the Vue app calls the Fastify
  API — DNS, TCP, HTTP, CORS, JSON parsing, response
- **Server basics (first pass)**: SSH into a VPS, run Docker on it, configure
  nginx with HTTPS, see your "Hello World" live on the internet

### AI assistance guideline
Use AI to explain concepts and generate boilerplate (tsconfig, docker-compose,
nginx config). Write the Fastify routes and Vue components yourself — they're
simple enough and you need the muscle memory.

### Definition of done
You can run `docker-compose up` locally and see the Vue app display data from the
API. The same thing is running on a VPS with HTTPS. You can explain to your
supervisor what each part does, how they connect, and what happens when a request
travels from the browser to the database and back.

---

## Stage 1 — Database design & API foundations

### Why this stage matters
The database is the foundation everything else builds on. The activity data model
determines how modes 1-3 work, how personalization works, and what the AI can do.
Getting this right now prevents painful migrations later.

### What you build
- PostgreSQL schema: users, activities, categories (with migrations)
- Seed script that populates the shared base activity list
- CRUD API endpoints for activities (`GET /activities`, `POST /activities`, etc.)
- API tested with integration tests and manually with Postman/Thunder Client
- Deploy to VPS (the API now serves real data)

### What you learn
- **Database design**: normalization, foreign keys, many-to-many relationships
  (activities ↔ categories), indexing basics
- **Migrations**: writing schema changes as versioned SQL files that can be
  applied and rolled back
- **REST API design**: resource naming, HTTP methods, status codes, request
  validation, error responses
- **SQL**: writing queries directly (not through an ORM) — SELECT with JOINs,
  INSERT, UPDATE, filtering

### The data model

```
┌──────────────┐       ┌─────────────────────┐       ┌──────────────┐
│    users     │       │    activities        │       │  categories  │
├──────────────┤       ├─────────────────────┤       ├──────────────┤
│ id           │──┐    │ id                  │    ┌──│ id           │
│ email        │  │    │ user_id ────────────│──┘ │  │ name         │
│ password_hash│  │    │ title               │    │  │ (Head,       │
│ device_id    │  │    │ description         │    │  │  Hands,      │
│ created_at   │  │    │ suggested_duration  │    │  │  Heart)      │
│ updated_at   │  │    │ min_stress_level    │    │  └──────────────┘
└──────────────┘  │    │ max_stress_level    │    │
                  │    │ source (base/user/ai)│   │
                  │    │ times_suggested     │    │
                  │    │ times_accepted      │    │
                  │    │ times_skipped       │    │
                  │    │ created_at          │    │
                  │    └─────────────────────┘    │
                  │                               │
                  │    ┌─────────────────────┐    │
                  │    │ activity_categories │    │
                  │    ├─────────────────────┤    │
                  │    │ activity_id ────────│────┘
                  │    │ category_id ────────│──┘
                  │    └─────────────────────┘
                  │
                  │    ┌─────────────────────┐
                  │    │   usage_events      │
                  │    ├─────────────────────┤
                  └───▶│ user_id             │
                       │ activity_id         │
                       │ action (suggested/  │
                       │   accepted/skipped) │
                       │ stress_level_before │
                       │ stress_level_after  │
                       │ created_at          │
                       └─────────────────────┘
```

**Design note — categories vs. tags:** The Head/Hands/Heart grouping works well
for Mode 3 (counterbalance logic), but it's very broad. Consider using HHH as a
PostgreSQL enum (not a separate table — three values don't need a join table) and
adding freeform tags (e.g., "indoor", "creative", "solo") for finer-grained
filtering and AI personalization. Decide this when designing the actual schema.

Key relationships:
- **users → activities**: one-to-many. Each user has their own activities.
  Activities with `user_id = null` are the shared base list.
- **activities ↔ categories**: many-to-many via `activity_categories`. An activity
  can be Head + Hands. A category has many activities.
- **users → usage_events**: one-to-many. Every suggestion/accept/skip is logged.
- **activities → usage_events**: one-to-many. Tracks how each activity performs.

### Tests
- Integration tests for each API endpoint (Vitest + Supertest): does
  `GET /activities?category=Head` return only Head activities? Does
  `POST /activities` validate required fields?
- Test the seed script: does it populate the expected number of activities?

### AI assistance guideline
Use AI to review your schema design — ask it to find flaws or suggest improvements.
Write the SQL and API code yourself. If you get stuck on a specific SQL query for
more than 30 minutes, ask AI to explain the concept (not to write the query).

### Definition of done
You can create a user, add activities, fetch a filtered activity list (by category,
by stress level), and see the results in Postman. The database has a seed script
with a base activity list of at least 20 activities. Integration tests pass. The
API is deployed and accessible on the VPS.

---

## Stage 2 — Authentication

### Why this stage matters
Auth is the bridge between "a database with data" and "a personalized app."
Without it, every user sees the same thing. After this stage, each user has their
own activity list and their own usage history. Auth is also one of the most
important things to understand deeply as a web developer — and one of the most
commonly done wrong.

### What you build

**Learning exercise (throwaway branch):**
- Manual JWT implementation: registration, login, token refresh, middleware
- Build it, understand it, then set it aside

**Actual app (using Lucia):**
- Registration endpoint (email + password)
- Login endpoint (returns session)
- Auth middleware that protects API routes
- Device-based anonymous auth (generates a user from device ID)
- "Upgrade" flow: anonymous user adds email/password to their existing account
- Refresh tokens stored in httpOnly cookies (not localStorage)

### What you learn
- **How JWT works**: header, payload, signature, expiry, why you need two tokens
  — learned in the throwaway exercise
- **Password security**: hashing with bcrypt, why you never store plaintext,
  what salt is
- **Middleware pattern**: code that runs before your route handler to verify
  identity
- **Secure token storage**: why httpOnly cookies for refresh tokens, why
  localStorage is vulnerable to XSS
- **Auth edge cases**: expired tokens, concurrent requests during refresh, logout
  (token invalidation)
- **The difference between "learning exercise" and "production code"**: knowing
  when to build from scratch and when to use a library

### Tests
This is the most important stage to test well:
- Integration tests for the full auth lifecycle: register → login → access
  protected route → token expires → refresh → access again
- Test the device-based auth flow separately
- Test the upgrade flow: anonymous user → adds email/password → data is preserved
- Test failure cases: wrong password, expired token, invalid refresh token

### AI assistance guideline
This is security-sensitive. Use AI to review your implementation for
vulnerabilities. Use Lucia and its crypto primitives — do not implement crypto
yourself. Write the middleware and auth flow yourself to understand it. For the
throwaway JWT exercise, build it fully manually to learn.

### Definition of done
You can register, log in, access a protected route, have your session expire,
refresh it silently, and continue without being logged out. You can also use the
app anonymously with a device ID and later upgrade to a full account without losing
data. All auth integration tests pass.

---

## Stage 3 — Modes 1-3 (no AI needed)

### Why this stage matters
This is where the app becomes *the app*. After this stage, a real user can install
it and get value from it. Modes 1-3 are the core product — the AI features in
later stages are enhancements, not requirements. This is also the first real
portfolio milestone: a working, deployed, useful app.

### What you build
- Frontend: the core app UI in Vue
  - App opens directly in Mode 1 (default) — one tap to get a suggestion
  - Modes 2 and 3 accessible via a simple navigation element, not upfront
  - Mode 1: "suggest" button → shows one activity card → accept/skip
  - Mode 2: stress level selector (1-5) → same suggestion flow, filtered
  - Mode 3: "what did you do today?" (Head/Hands/Heart) → suggests from
    different category
- Backend: endpoints that serve randomized, filtered activities
- Usage tracking: every suggest/accept/skip is recorded as a usage event
- Deploy to VPS

### What you learn
- **Vue Composition API in practice**: composables, reactive state, component
  design
- **UX for constrained interaction**: designing an interface that's simple enough
  for a stressed brain. One thing on screen at a time. Big touch targets. No
  clutter.
- **API integration**: fetch calls, loading states, error handling
- **The accept/skip tracking pattern**: how implicit user feedback works as a
  data source

### Design notes
- Implement the three theme presets here (calm, warm, playful). CSS custom
  properties make this straightforward.
- Use `vue-i18n` from the start — even if everything is Dutch for now, all strings
  go through the translation system.
- Keep the UI card-based: one card = one activity suggestion. Swipe or tap to
  skip/accept.

### Tests
- Unit tests for the filtering/randomization logic: does filtering by stress level
  work correctly? Does category counterbalancing exclude the right categories?
- Component tests for the suggestion card: does accept trigger the right API call?
  Does skip show the next activity?
- Test edge cases: what happens when no activities match the filter? What if the
  user's list is empty?

### AI assistance guideline
Build this yourself — it's core Vue work that you should be fluent in. Use AI
only if you get stuck on a specific CSS layout or animation issue.

### Definition of done
A logged-in user can use all three modes, see relevant suggestions, accept/skip
them, and the usage data is recorded in the database. The app looks and feels
minimal. It works on a phone-sized viewport. The app is deployed and usable on
the VPS. Tests pass.

---

## Stage 4 — PWA & offline support

### Why this stage matters
Your target users may want to use this app anywhere — on the couch without WiFi,
on a train in a tunnel, or simply when their internet is flaky. Making modes 1-3
work offline means the core app is always available, regardless of connectivity.
This also teaches offline-first architecture, which is a genuinely advanced skill
that most junior developers never encounter.

### What you build
- PWA manifest (app name, icons, splash screen, theme color)
- Service worker that caches the app shell
- Offline data layer: sync the user's activity list to IndexedDB
- Offline modes 1-3: filtering and randomization happen client-side when offline
- Sync queue: actions taken offline (accept/skip) are queued and synced when
  back online
- "New version available" update prompt
- **iOS testing checkpoint**: test all of the above on a real iOS device.
  Document what works and what doesn't. Decide whether iOS limitations are
  acceptable or whether Capacitor should be evaluated sooner.

### What you learn
- **Service workers**: what they are, their lifecycle (install, activate, fetch),
  how they intercept network requests
- **IndexedDB**: browser-side database for structured data
- **Offline-first architecture**: the local copy is the primary data source, the
  server is the sync target
- **Cache strategies**: cache-first for the app shell, network-first for API data
- **Sync patterns**: background sync queue, conflict resolution (last-write-wins
  is fine for this scale)
- **Cross-platform testing**: discovering that "works on Chrome Android" does not
  mean "works on Safari iOS"

### Tests
- Test offline scenarios manually: turn off network, use modes 1-3, go back
  online, verify sync
- Integration tests for the sync queue: queue actions offline, simulate coming
  back online, verify they're sent
- Test on both Android and iOS devices — not just desktop browsers

### AI assistance guideline
Service worker code is notoriously tricky and hard to debug. Use AI to help you
understand the lifecycle and generate the initial service worker. But manually test
offline scenarios yourself — turn off your network and use the app. That's how you
find the bugs.

### Definition of done
You can install the app on your phone from the browser. You can turn on airplane
mode and use modes 1-3. When you go back online, queued actions sync to the server.
The app doesn't feel "broken" offline — it feels intentionally offline-capable.
You have a documented list of iOS-specific issues (if any) and a decision on
whether they're acceptable.

---

## Stage 5 — AI integration (Mode 4 & onboarding)

### Why this stage matters
This is where the app goes from "useful tool" to "smart tool." An LLM API is
a piece of infrastructure — like a database or an auth system — and learning to
integrate one is a genuinely differentiating skill in 2026. This stage also teaches
prompt engineering, streaming, and cost management — practical AI skills that
most tutorials skip.

### What you build
- Backend: a `/chat` endpoint that proxies to the Claude API with a system prompt
- **Prototype first**: test the onboarding conversation in isolation before
  building the UI. Run it 5-10 times with different fake users. Does it produce
  meaningfully different lists? If not, consider a structured form instead.
- Onboarding flow: a short AI-guided conversation that generates a personalized
  starter activity list (or a structured form + AI enrichment, depending on
  prototype results)
- Mode 4 UI: a simple chat interface with predefined quick-reply buttons
  (yes/no, simple choices) to minimize typing
- Activity suggestions from mode 4 can be saved to the user's list
- Basic cost controls: rate limiting per user, conversation length limits,
  conversation context capped to last 4 exchanges
- Use Claude Haiku for Mode 4, Sonnet for onboarding

### What you learn
- **LLM API integration**: system prompts, message history, streaming responses,
  token usage
- **Prompt engineering**: crafting system prompts that keep the AI focused (short
  questions, simple choices, activity-relevant responses only)
- **Structured output from LLMs**: getting the model to return activities in a
  parseable format (title, duration, category, stress range) — and handling it
  gracefully when it doesn't
- **Streaming**: showing AI responses as they generate (better UX than waiting for
  the full response)
- **Cost management**: estimating token usage, setting budgets, caching where
  possible
- **Privacy-aware AI usage**: what to send to the API and what to keep local

### System prompt structure (rough idea)
```
Mode 4 system prompt:
- You help neurodivergent users find a relaxing activity
- Ask simple questions with yes/no or max 3 choices
- Never ask open-ended questions
- Keep the conversation under 6 exchanges
- Suggest one activity at a time with a specific duration
- You know the user's current stress level: {stress_level}
- Categories to avoid (already done today): {categories}
- Do not ask for personal information
- Return activity suggestions in this JSON format: { title, description,
  category, duration_minutes, min_stress, max_stress }
```

### Tests
- Test the AI proxy endpoint: does it forward correctly, handle errors, respect
  rate limits?
- Test structured output parsing: what happens when the LLM returns malformed
  JSON? Does the app recover gracefully?
- Test cost controls: does the per-user rate limit work?

### AI assistance guideline
This is where you should use AI the most — to help you understand the Claude API,
draft system prompts, and debug streaming. Prompt engineering is a skill best
learned by iterating, and having AI help you iterate on prompts is efficient
and meta.

### Definition of done
A new user can go through an onboarding flow that generates 10-15 personalized
activities in their list. An existing user can use mode 4 to have a short
conversation that results in an activity suggestion. The conversation feels simple
and low-effort. API costs are tracked and limited. The AI features are deployed.

---

## Stage 6 — Deployment hardening & error tracking

### Why this stage matters
You've been deploying incrementally since Stage 0, but the full app is now live
with auth, offline sync, and AI features. This stage makes the deployment
production-ready: automated, monitored, and debuggable. This is the DevOps
knowledge that separates "I built a project" from "I run a project."

### What you build
- Dockerfiles optimized with multi-stage builds
- `docker-compose.production.yml` for the full stack
- GitHub Actions pipeline: push to main → run tests → build → deploy to VPS
- Sentry integration for error tracking (free tier)
- Structured logging with Pino (already built into Fastify)
- Environment variable management (secrets not in code)
- Basic server security: firewall (ufw), fail2ban, automatic security updates

### What you learn
- **Docker in depth**: multi-stage builds, volumes, networking between containers
- **CI/CD**: automated testing and deployment, the concept of a deployment pipeline
- **Error tracking**: catching production errors without relying on user reports
- **Environment management**: .env files, secrets, the difference between dev and
  production configuration
- **Server hardening basics**: the minimum security for a public-facing server

### AI assistance guideline
Use AI heavily for Docker, nginx, and CI/CD configuration — these are declarative
configs where understanding what the config does matters more than memorizing
syntax. But SSH into the server yourself, run the commands, watch the logs. Don't
automate what you don't yet understand.

### Definition of done
The app is live on a domain with HTTPS. You can push to main and the app
auto-deploys within minutes. Sentry catches errors. You can explain to someone
what happens between "git push" and "the user sees the update."

---

## Stage 7 — Polish, feedback & portfolio presentation

### Why this stage matters
A working app becomes a *good* app through real user feedback. And a good app
becomes a *career asset* through presentation. This stage is about both: making
the app solid enough to show real users, and making it visible enough to show
hiring managers.

### What you build

**App polish:**
- Post-activity feedback: "How do you feel now?" (stress level comparison)
- Smarter suggestions: activities the user often accepts are weighted higher,
  frequently skipped ones are deprioritized
- An explicit "never suggest this again" button for faster personalization signal
- Activity management: user can edit/delete activities, add new ones manually
- Error handling and edge cases: what if the AI API is down? What if the database
  is empty? What if the user has no activities matching their filters?

**Portfolio presentation:**
- A clear README: what is this, why was it built, the stack, screenshots, a live
  demo link, how to run locally
- Architecture Decision Records (ADRs) in the repo: short markdown files
  documenting major choices (why Fastify, why Lucia, why PWA, etc.)
- API documentation: endpoint list with methods and payloads
- A short demo video (30-60 seconds) walking through the app — useful for LinkedIn
  and for recruiters who won't clone the repo

### What you learn
- **Product thinking**: taking a working app and making it good
- **Data-driven features**: using the usage_events table to inform behavior
- **Edge case handling**: the difference between "it works" and "it works reliably"
- **User feedback**: letting real users try it and iterating based on what
  confuses them
- **Technical communication**: explaining your work to both technical and
  non-technical audiences

### Definition of done
Five people have used the app for a week. You've fixed the top 3 issues they
found. The app handles edge cases gracefully. The README and portfolio materials
are complete. A hiring manager can understand what you built and why within
60 seconds of landing on the repo.

---

## Stage 8 — Stretch goals

These are not part of the initial build but are natural next steps, roughly in
priority order:

- **React version of the frontend**: the backend stays the same. Rebuilding the
  frontend in React is a focused 2-3 week exercise that widens your job market
  reach significantly in the Netherlands. This is a *deliberate learning exercise*,
  not an admission that Vue was the wrong choice — it demonstrates that you can
  work across frameworks because you understand the underlying concepts.
- **Energy tracking integration**: API communication with the colleague's app.
  Requires defining a shared API contract.
- **Multi-language support**: activate `vue-i18n`, add English translation file.
- **Advanced personalization**: use accumulated usage data to weight suggestions
  more intelligently (e.g., time-of-day patterns, seasonal preferences).
- **Shared activity lists**: let users share lists with a partner or household.

---

## ADR log (to be maintained during the project)

As you build, document each significant decision as a short ADR (Architecture
Decision Record). These are short — a paragraph or two each — and live in an
`/docs/adr/` folder in the repo. Template:

```markdown
# ADR-001: [Decision title]

## Status: Accepted

## Context
[What situation prompted this decision?]

## Decision
[What did you decide?]

## Consequences
[What are the tradeoffs? What becomes easier/harder?]
```

Starting list of ADRs to write as you go:
- ADR-001: Monorepo structure (frontend + backend in one repo)
- ADR-002: Fastify over Express
- ADR-003: Raw SQL over ORM/query builder
- ADR-004: Lucia over custom JWT for production auth
- ADR-005: PWA over native app
- ADR-006: Claude Haiku for Mode 4, Sonnet for onboarding
- ADR-007: Offline-first with IndexedDB
- ADR-008: VPS over managed hosting
