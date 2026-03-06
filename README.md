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
