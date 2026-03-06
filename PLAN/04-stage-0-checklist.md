# Stage 0 — Project setup, architecture understanding & first deployment

## Goal

See the whole system working end-to-end before writing a single feature.
Frontend talks to backend, backend talks to database, everything runs in Docker,
and eventually it's live on a real server with HTTPS.

---

## Steps

### Step 1: Project scaffolding [done]

Create the monorepo folder structure:

```
unwind/
├── frontend/          # Vue 3 + Vite
├── backend/           # Fastify + TypeScript
├── docker-compose.yml # PostgreSQL (for now)
├── PLAN/
├── CLAUDE.md
└── .gitignore
```

Frontend and backend are independent projects, each with their own `package.json`.
They share a repo, not dependencies.

### Step 2: Backend — Fastify health endpoint [done]

- `npm init` in `/backend`
- Install `fastify`, `typescript`, `tsx`
- Create a `tsconfig.json` configured for Node.js
- Write a `src/server.ts` with `GET /health` returning `{ status: "ok" }`
- npm script: `npm run dev` runs the server with hot reload via `tsx watch`

**Reading material:**
- Fastify Getting Started: https://fastify.dev/docs/latest/Guides/Getting-Started/
- tsx: https://github.com/privatenumber/tsx
- tsconfig reference: https://www.typescriptlang.org/tsconfig/ (for `module` and `moduleResolution`)

### Step 3: Frontend — Vue app that calls the API [done]

- `npm create vue@latest` in `/frontend`
- Strip the demo/scaffold content
- One component that fetches from the health endpoint and displays the result
- Set up `vue-i18n` from the start — Dutch only, all strings through `$t()`

**Reading material:**
- vue-i18n Getting Started: https://vue-i18n.intlify.dev/guide/

### Step 4: CORS — make them talk [done]

- Install `@fastify/cors` on the backend
- Configure it to allow requests from the frontend's origin
- Verify the Vue app can fetch from the Fastify server

**Reading material:**
- MDN on CORS: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
- @fastify/cors: https://github.com/fastify/fastify-cors

### Step 5: Docker — PostgreSQL without installing it [done]

- Write a `docker-compose.yml` with a PostgreSQL 17 service
- Install the `pg` package in the backend
- Add a connection test on server startup (log success/failure)
- `docker-compose up` starts PostgreSQL, backend connects to it

**Reading material:**
- Docker overview: https://docs.docker.com/get-started/docker-overview/
- Docker Compose quickstart: https://docs.docker.com/compose/gettingstarted/
- node-postgres (`pg`): https://node-postgres.com/

### Step 6: Deploy to VPS [todo]

- Rent a VPS (Hetzner has a Dutch data center, good pricing)
- SSH in, install Docker and Docker Compose
- Clone the repo or copy the project over
- Set up nginx as a reverse proxy
- Set up HTTPS with Let's Encrypt (Certbot)
- See `https://yourdomain.com/health` return `{ status: "ok" }`

This is the hardest step in Stage 0 — not conceptually, but because servers are
unforgiving about small mistakes (firewall rules, wrong ports, nginx config
typos). Budget extra time.

**Reading material:**
- SSH basics: https://www.digitalocean.com/community/tutorials/how-to-use-ssh-to-connect-to-a-remote-server
- nginx reverse proxy: https://docs.nginx.com/nginx/admin-guide/web-server/reverse-proxy/
- Let's Encrypt with Certbot: https://certbot.eff.org/

---

## Notes for later stages

These are fine for Stage 0 local dev but need attention before real deployment:

- **Hardcoded DB credentials** in `server.ts` — should become environment
  variables (loaded from `.env` or Docker Compose environment config) before
  deploying to the VPS.
- **CORS is wide open** — `cors({})` allows all origins. Before deployment,
  restrict to the frontend's actual origin (e.g., `https://yourdomain.com`).
- **DB connection doesn't block server startup** — the server starts whether or
  not PostgreSQL is reachable. This is reasonable behavior (the server can serve
  the health endpoint regardless), but be aware that API routes depending on the
  database will fail silently if the DB is down.

---

## Definition of done

- `docker-compose up` starts PostgreSQL locally.
- The Fastify backend connects to the database and serves `GET /health`.
- The Vue frontend fetches from the API and displays the result using `vue-i18n`.
- The same thing runs on a VPS with HTTPS (Step 6).
- You can explain what each part does, how they connect, and what happens when a
  request travels from the browser to the database and back.
