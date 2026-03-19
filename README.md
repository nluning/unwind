# Unwind

Activity suggestion app for neurodivergent brains that struggle to switch off.

See `PLAN/` for detailed documentation on the concept, stack choices, and build plan.

## Prerequisites

- [Node.js](https://nodejs.org/) v22+
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

## Getting started

### 1. Start the database

From the project root:

```bash
docker-compose up -d
```

This starts PostgreSQL on `localhost:5432`. The `-d` flag runs it in the background.

### 2. Start the backend

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
├── frontend/          # Vue 3 + Vite
├── backend/           # Fastify + TypeScript
├── docker-compose.yml # PostgreSQL
└── PLAN/              # Design docs and build plan
```

## Stopping everything

- Frontend/backend: `Ctrl+C` in their terminals
- Database: `docker-compose down` from the project root
