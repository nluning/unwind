# Unwind

Activity suggestion app for neurodivergent brains (autistic/ADHD, gifted) that 
struggle to switch off. Suggests relaxation activities tailored to the user 
through four modes: randomsuggestion, stress-filtered, counterbalance-based, 
and AI-guided conversation.

This project has a dual purpose: build a genuinely useful app **and** develop
transferable skills (API design, auth, raw SQL, AI integration, deployment) by
building without the scaffolding of a full-stack framework. See
[`docs/plan/03-learning-plan.md`](docs/plan/03-learning-plan.md) for the full
rationale and [`docs/adr/`](docs/adr/) for the architectural decisions.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User's phone                         │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐    │
│  │              Vue 3 PWA (installed)                  │    │
│  │                                                     │    │
│  │  ┌──────────────┐    ┌───────────────────────────┐  │    │
│  │  │  Vue UI      │    │  IndexedDB (local copy)   │  │    │
│  │  │  - modes 1-4 │    │  - activity list          │  │    │
│  │  │  - themes    │    │  - pending sync queue     │  │    │
│  │  │  - i18n      │    │                           │  │    │
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
│                    VPS (Docker)                              │
│                                                             │
│  ┌──────────┐    ┌──────────────────┐    ┌──────────────┐   │
│  │  Nginx   │───▶│  Fastify API     │───▶│ PostgreSQL   │  │
│  │  (HTTPS) │    │  (TypeScript)    │    │              │  │
│  │          │    │                  │    │ - users      │  │
│  └──────────┘    │  - auth (oslo)  │    │ - activities │  │
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
                  └──────────────────┘
```

Modes 1-3 work entirely from local data — no server needed. Only mode 4 (AI
chat), syncing, and auth require a connection.

See `docs/plan/` for design docs, `docs/adr/` for architecture decisions.

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Getting started

### 1. Start the database

From the project root:

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5555`. The `-d` flag runs it in the background.

### 2. Configure the backend environment

Copy the example and adjust if needed:

```bash
cp backend/.env.example backend/.env
```

The defaults match the Docker database above. If you changed ports or credentials in `docker-compose.yml`, update `.env` to match.

### 3. Start the backend

```bash
cd backend
npm install
npm run dev
```

The API runs on `http://localhost:3000`. Check it works: open `http://localhost:3000/health` in your browser.

### 3. Start the frontend

In a separate terminal:

```bash
cd frontend
npm install
npm run dev
```

The app runs on `http://localhost:5173`.

### 4. Set up the database

Run migrations and seed the base activity list:

```bash
cd backend
npm run migrate
npm run seed
```

### 5. Run tests

Tests run against a separate `unwind_test` database. Make sure `.env.test` exists in `backend/` with the test DB credentials, then:

```bash
cd backend
npm test
```

This automatically runs migrations on the test DB before the test suite starts.

## Project structure

```
unwind/
├── frontend/          # Vue 3 + Vite + UnoCSS
├── backend/           # Fastify + TypeScript + raw SQL
├── docs/adr/          # Architecture Decision Records
├── docs/plan/         # Design docs and build plan
└── docker-compose.yml # PostgreSQL
```

## Stopping everything

- Frontend/backend: `Ctrl+C` in their terminals
- Database: `docker-compose down` from the project root
