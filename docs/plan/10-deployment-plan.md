# Going live — deployment plan

**Current status: Phase 1 complete — Docker builds and runs locally. Not deployed yet.**

## What this document covers

Everything between "it works on my laptop" and "someone can open a URL and use
the app." That includes privacy fixes, containerization, server setup, HTTPS,
CI/CD, monitoring, and known bug fixes.

This plan assumes zero deployment experience. Each step explains *why* before
*how*, and is ordered so that each piece builds on the one before it. The goal
is not just a running server — it's understanding what every piece does, so you
can debug it when something breaks at 11pm.

The approach: **manual first, automate second.** You'll deploy by hand before
writing a CI/CD pipeline, because automating something you don't understand
just moves the confusion somewhere harder to debug.

---

## The big picture

Here's what the deployed stack looks like. Read this now; it'll make every
subsequent section make sense.

```
User's browser
      │
      │  HTTPS (port 443)
      ▼
┌──────────┐
│  nginx   │  ← reverse proxy + SSL termination
└────┬─────┘
     │
     ├── /api/*  →  backend container (port 3000)
     │                 └── Fastify + TypeScript
     │                 └── connects to PostgreSQL container
     │
     └── /*      →  frontend static files (built by Vite)
                      └── served directly by nginx
```

**Why nginx sits in front of everything:** Your backend is a Node.js process.
It *could* serve HTTPS directly, but nginx is purpose-built for this: it
handles SSL certificates, serves static files faster than Node, and acts as a
single entry point so the outside world only sees one port (443). When
something goes wrong, you debug one layer at a time instead of everything at
once.

**Why Docker:** Instead of installing Node, PostgreSQL, and nginx directly on
the server (where versions clash, configs get messy, and "works on my machine"
becomes your life), each service runs in an isolated container with its own
dependencies. You describe the setup in files, and it's reproducible on any
machine.

---

## Safe stopping points between phases

Deployment is multi-session work. "Safe to stop" has two dimensions: the infra
is stable when you come back, *and* nobody else is exposed to a half-finished
system.

Three guilt-free walkaway points:

- **After Phase 1** — nothing running, nothing exposed, no running costs.
  The cleanest pause.
- **After Phase 3** — live + HTTPS. The "works on the internet" milestone.
  Don't share the URL yet (no monitoring, no fail2ban).
- **After Phase 5** — first point where inviting real users is genuinely
  low-risk.

**Avoid stopping after Phase 2.** HTTP-only, `secure: true` cookies don't work
in a real browser, and bots probe SSH within hours of the VPS existing.
Phases 2 and 3 are really one unit — budget them together.

Pairings to treat as atomic:

- **2 + 3** — exposing a service and securing it are halves of one action.
- **4 + 5** — monitoring + hardening together, before inviting users.

Keep a `Current status:` line at the top of this file (e.g. *"Phase 3 complete,
not yet user-safe — don't share URL"*) so future-you doesn't ship prematurely.

---

## Phase 0 — Pre-deployment fixes

Before anything goes on a server, fix the things that would be security issues
or legal problems in production. These are code changes in your existing
codebase.

### 0.1 CORS fallback vulnerability

**The problem:** In your SSE streaming endpoint, the CORS header falls back to
an empty string if `FRONTEND_URL` is missing. An empty `Access-Control-Allow-Origin`
header doesn't block requests in all browsers consistently.

**The fix:** Fail hard on startup if `FRONTEND_URL` is not set in production.
The app should refuse to start rather than run with an insecure default.

**What you learn:** Defense in depth — don't let missing config silently
degrade security. This pattern (validate env vars at startup) applies to every
backend you'll ever build.

- [x] Add env var validation on server startup: require `FRONTEND_URL`
  when `NODE_ENV=production`
- [ ] Remove the `?? ''` fallback in the SSE CORS header

*Label: try-first.* You've written Fastify config before. Check how other
vars are loaded and add validation in the same place.

### 0.2 Account deletion endpoint

**The problem:** GDPR gives users the right to delete their data. The database
has `ON DELETE CASCADE` on all user-related tables, so deleting the user row
cleans up everything — but there's no API endpoint to trigger it.

**The fix:** Add `DELETE /me` (authenticated) that deletes the requesting
user's row. The cascades handle the rest.

**What you learn:** The practical side of "privacy by design." Cascade
deletes are powerful — one `DELETE FROM users WHERE id = $1` wipes activities,
memories, usage events, sessions, and API usage records. That's the payoff of
designing your foreign keys correctly in Stage 1.

- [x] Add `DELETE /me` endpoint (auth required)
- [x] Invalidate the user's session after deletion (clearCookie)
- [x] Return 204 No Content on success

*Label: try-first.* You know the route + auth middleware pattern.

### 0.3 Privacy notice page

**The problem:** Users need to know what data you collect, that chat data goes
to Anthropic, and what their rights are. This doesn't need to be legal jargon
— plain Dutch is actually better for your audience.

**What to cover:**
- What data is stored (account, activities, usage events, memories)
- What gets sent to Anthropic (chat messages, memories, stress level) and why
- That Anthropic doesn't train on API data
- That memories are opt-in and can be deleted
- How to delete your account (once the endpoint exists)
- Contact info (your email)

- [x] Create `PrivacyPage.vue` with the notice in Dutch
- [x] Add route `/privacy` (public, no auth required)
- [x] Link to it from the user menu and login page

*Label: try-first for the route/page, AI helps with the Dutch GDPR content.*

### 0.4 Known bug fixes

These aren't security issues but they'll confuse real users.

- [ ] **Suggest mode "out of activities" bug** — suggestion flow state doesn't
  reset when switching modes. Investigate the composable state lifecycle.
- [ ] **Onboarding flag is browser-scoped** — `localStorage('unwind-onboarding-done')`
  persists across logouts. Move to a per-user flag (database column or check
  whether the user has activities).
- [ ] **Hardcoded Dutch strings in onboarding** — move to i18n keys (one TODO
  already in the code)

*Label: try-first for all three.* These are Vue state and data-flow bugs in
code you wrote.

---

## Phase 1 — Docker: containerize the app

### Why this phase matters

Right now, running the app requires: install Node, install PostgreSQL, run
migrations, seed the database, start the backend, start the frontend. That's
fine on your laptop. On a server — and for anyone else who wants to run the
app — it needs to be one command.

Docker packages each service into a self-contained image. The image includes
the code, the runtime, and all dependencies. `docker-compose up` starts
everything. If it works in the container locally, it'll work in the container
on the server.

### What you learn

- **Dockerfile anatomy:** `FROM`, `COPY`, `RUN`, `CMD` — each instruction
  creates a layer in the image
- **Multi-stage builds:** build in one stage (with dev dependencies), copy
  only the output to a smaller runtime stage. The final image doesn't include
  TypeScript, Vite, or node_modules dev deps.
- **Docker Compose networking:** containers talk to each other by service name
  (`db`, `backend`), not by IP address. The `depends_on` key controls startup
  order.
- **Volumes:** persistent data (PostgreSQL) survives container restarts because
  it lives in a volume, not inside the container.
- **Build context and .dockerignore:** what gets sent to Docker when building,
  and why you exclude `node_modules` and `.env`.

### Steps

- [x] **1.1 Backend Dockerfile** — multi-stage build:
  - Stage 1 (`builder`): install deps, compile TypeScript with `tsc`
  - Stage 2 (`runtime`): copy compiled JS + production `node_modules`, run with
    `node`
  - Expose port 3000
- [x] **1.2 Frontend Dockerfile** — multi-stage build:
  - Stage 1: install deps, run `vite build`
  - Stage 2: copy the `dist/` folder into an nginx image that serves static
    files
  - This means the frontend container *is* an nginx that serves your Vue app
- [x] **1.3 `.dockerignore`** files for both — exclude `node_modules`, `.env`,
  `dist/`, `.git`
- [x] **1.4 `docker-compose.production.yml`** — orchestrates all three services:
  - `db` (PostgreSQL, with a volume for data persistence)
  - `backend` (your Fastify app, connects to `db`)
  - `frontend` (nginx serving Vue, proxies `/api` to `backend`)
  - Environment variables passed via `env_file` or `environment` block
- [x] **1.5 Test locally** — `docker-compose -f docker-compose.production.yml up --build`
  should start the entire app. Register, use all modes, chat. If it works here,
  it'll work on the server.

*Label: AI writes the first Dockerfile and explains each line. You write the
second one based on the same pattern. Compose file is collaborative — the
networking concepts are new.*

### Checkpoint

Before moving on, you should be able to answer:
- What's the difference between a Docker image and a container?
- Why does the built image not contain TypeScript or dev dependencies?
- How does the backend container find the database? (Hint: it's not `localhost`)
- What happens to the PostgreSQL data if you run `docker-compose down`? What
  about `docker-compose down -v`?

---

## Phase 2 — VPS setup (manual deployment)

### Why this phase matters

This is the phase where you SSH into a real server and make the app run on it.
You're doing this manually *on purpose*. CI/CD comes later — you need to
understand what happens on the server before you can automate it.

### What you learn

- **SSH:** how to connect to a remote machine, what key-based auth is, why you
  disable password login
- **Linux server basics:** navigating the filesystem, managing processes,
  reading logs
- **Environment variables on a server:** `.env` files, why secrets don't go in
  the repo
- **DNS:** what an A record does, how a domain name points to an IP address
- **The deployment as a series of concrete steps** — so when you automate it
  in Phase 4, you know exactly what the automation is doing

### Prerequisites

You need:
- A VPS (Virtual Private Server). Providers: Hetzner, DigitalOcean, or Vultr.
  The cheapest tier (~4-6 EUR/month) is more than enough for ~100 users.
  Pick a European server location (Amsterdam or Frankfurt) for GDPR data
  residency.
- A domain name. Can be a subdomain of something you already own, or a new
  cheap domain.
- SSH access configured (your VPS provider will guide you through this)

### Steps

- [ ] **2.1 Server initial setup**
  - SSH into the VPS
  - Create a non-root user with sudo access (never run services as root)
  - Set up SSH key auth, disable password login
  - Install Docker and Docker Compose
- [ ] **2.2 Get your code onto the server**
  - `git clone` your repo on the server (or `scp` the docker-compose file +
    built images)
  - Create the production `.env` file on the server (manually, not from the
    repo). This contains `DATABASE_URL`, `FRONTEND_URL`, `ANTHROPIC_API_KEY`,
    `SESSION_SECRET`, etc.
  - **Never commit production secrets to git**
- [ ] **2.3 Run the app**
  - `docker-compose -f docker-compose.production.yml up -d` (`-d` = detached,
    runs in the background)
  - Run migrations inside the backend container
  - Run the seed script
  - Check logs: `docker-compose logs -f`
- [ ] **2.4 DNS**
  - Point your domain to the server's IP address (A record in your DNS
    provider)
  - Wait for propagation (usually minutes, sometimes hours)
  - Verify: `curl http://yourdomain.com/api/health` should return a response

*Label: collaborative. AI explains, you type the commands yourself. Don't copy
paste SSH commands without understanding them — you'll need to debug them
later.*

### Checkpoint

At this point the app is running on your server on port 80 (HTTP, not HTTPS
yet). You can open it in a browser. It's not secure yet — that's the next
phase.

---

## Phase 3 — Nginx + HTTPS

### Why this phase matters

Without HTTPS, everything between the user's browser and your server travels
in plaintext — passwords, session tokens, chat messages, stress levels. Your
auth cookies are configured with `secure: true` in production, meaning they
won't even work over HTTP. HTTPS is not optional.

### What you learn

- **TLS/SSL:** what happens during the handshake, what a certificate proves,
  why browsers trust Let's Encrypt
- **Nginx as a reverse proxy:** one entry point that routes requests to
  different services based on the URL path
- **Certbot:** automates certificate issuance and renewal from Let's Encrypt
  (free certificates, valid for 90 days, auto-renewed)

### Steps

- [ ] **3.1 Nginx configuration**
  - Serve the frontend (static files) on `/`
  - Proxy `/api/*` requests to the backend container
  - Proxy `/api/chat/stream` with SSE-specific settings (disable buffering —
    this is critical for streaming to work)
  - Redirect HTTP (port 80) to HTTPS (port 443)
- [ ] **3.2 SSL with Let's Encrypt**
  - Install certbot on the server (or use the certbot Docker image)
  - Generate a certificate for your domain
  - Configure nginx to use the certificate
  - Set up auto-renewal (certbot handles this, but verify it works)
- [ ] **3.3 Frontend production build**
  - Add `VITE_API_URL` environment variable to the frontend build
  - This tells the Vue app where the backend lives (e.g.,
    `https://yourdomain.com/api`)
  - Rebuild the frontend Docker image with this variable baked in
- [ ] **3.4 Backend production config**
  - Ensure `server.ts` binds to `0.0.0.0` (not `127.0.0.1` — containers need
    to accept connections from outside)
  - Add a proper `tsc` build step (currently runs via `tsx` dev transpiler)
  - Set `NODE_ENV=production`
  - Verify `trustProxy` is set in Fastify (it sits behind nginx, so it needs
    to trust the proxy's forwarded headers for correct IP addresses and HTTPS
    detection)
- [ ] **3.5 Verify end-to-end**
  - Open `https://yourdomain.com` — should load the Vue app
  - Register, log in, use all modes, chat with Claude
  - Check that cookies work (they require HTTPS + secure flag)
  - Check that SSE streaming works (nginx buffering can break this silently)
  - Test on your phone's browser

*Label: AI writes the nginx config (it's purely declarative). You run the
certbot commands yourself. Backend changes are try-first.*

### Checkpoint

The app is live, on HTTPS, with a real domain. This is the first time a real
user could use it. Before sharing it with anyone, continue to Phase 4 for
monitoring, or at minimum Phase 5 for basic security.

You should be able to answer:
- What does nginx do with a request to `/api/chat/stream`?
- Why does nginx need to disable buffering for SSE?
- What happens when the SSL certificate expires?
- What is `trustProxy` and why does the backend need it?

---

## Phase 4 — Monitoring & error tracking

### Why this phase matters

Once real users are using the app, you need to know when things break —
without them telling you. Sentry catches errors. Pino logs tell you what
happened leading up to the error. Together, they make production debugging
possible.

### What you learn

- **Error tracking as infrastructure:** Sentry is to production errors what
  tests are to development bugs — an early warning system
- **Structured logging:** instead of `console.log("something broke")`, Pino
  outputs JSON with timestamps, log levels, request IDs, and context. This
  makes logs searchable and parseable.
- **The difference between logging and monitoring:** logs record what happened,
  monitoring alerts you when something is wrong

### Steps

- [ ] **4.1 Sentry setup (backend)**
  - Create a free Sentry account and project
  - Install `@sentry/node`
  - Initialize Sentry in the Fastify app (captures unhandled errors
    automatically)
  - Add the Anthropic API key error, rate limit hits, and database errors as
    tracked events
- [ ] **4.2 Sentry setup (frontend)**
  - Install `@sentry/vue`
  - Initialize in `main.ts`
  - Captures Vue component errors, network failures, unhandled promise
    rejections
- [ ] **4.3 Pino production config**
  - Fastify already uses Pino — configure it for production:
    - Log level `info` (not `debug`)
    - JSON output (not pretty-printed)
    - Add request ID to every log line
  - Route container logs to a file or log management service (or just
    `docker-compose logs` for now — sufficient at ~100 users)
- [ ] **4.4 Health check improvements**
  - Extend `GET /health` to check database connectivity
  - Use this as Docker's `HEALTHCHECK` — Docker restarts the container if
    health checks fail

*Label: AI writes the Sentry integration (new SDK, new concept). Pino config
is try-first — it's Fastify configuration you've done before.*

---

## Phase 5 — Server hardening

### Why this phase matters

Your server is on the public internet. Automated bots will find it within
hours and try to brute-force SSH, scan for open ports, and probe for
vulnerabilities. Basic hardening stops the automated noise.

### What you learn

- **Firewall (ufw):** which ports are open and why. Only 22 (SSH), 80 (HTTP
  redirect), and 443 (HTTPS) need to be open.
- **fail2ban:** watches log files for repeated failed login attempts and
  temporarily bans the IP. Stops brute-force attacks.
- **Automatic security updates:** the server patches itself for known
  vulnerabilities without you manually running `apt upgrade` every week.

### Steps

- [ ] **5.1 Firewall**
  - Enable `ufw`
  - Allow ports 22, 80, 443 only
  - Deny everything else
- [ ] **5.2 fail2ban**
  - Install and enable
  - Configure for SSH (default config is usually fine)
- [ ] **5.3 Automatic security updates**
  - Enable `unattended-upgrades` on Ubuntu/Debian
- [ ] **5.4 Docker security basics**
  - Don't run containers as root (use `USER` in Dockerfiles)
  - Don't expose database port to the host (only accessible within Docker
    network)

*Label: collaborative. AI explains each command, you run them.*

---

## Phase 6 — CI/CD with GitHub Actions

//   This bug existing means your CI doesn't run tsc --noEmit. Worth thinking about for after deploy: a precommit hook or GitHub Actions step that
   runs tsc --noEmit (and vitest) on every push prevents this exact class of "the build fails on the server" surprise. It's a Phase 6 concern  
  (CI/CD), but the question to ask now is: do you want type-checking to happen at build time (where it's late and disruptive) or at commit/push
   time (where it's early and cheap)? //


### Why this phase matters

At this point you've deployed manually: build images, push to server, restart
containers. CI/CD automates this so that `git push` to main triggers: run
tests → build images → deploy. This is the point where the learning plan says:
"Don't automate what you don't yet understand." You understand now, so you can
automate with confidence.

### What you learn

- **GitHub Actions anatomy:** workflows, jobs, steps, triggers
- **The deployment pipeline concept:** code change → tests → build → deploy,
  and why each stage can fail independently
- **Docker image registries:** where built images live so the server can pull
  them (GitHub Container Registry is free for public repos)
- **Secrets management in CI:** GitHub secrets for SSH keys, env vars

### Steps

- [ ] **6.1 Test workflow**
  - On every push: install deps, run backend tests
  - This alone catches broken code before it reaches the server
- [ ] **6.2 Build + deploy workflow**
  - On push to `main`: build Docker images, push to registry, SSH into server,
    pull new images, restart containers
  - Use GitHub secrets for the SSH key and server address
- [ ] **6.3 Verify the full cycle**
  - Make a small change, push to main, watch the action run, see the change
    live on the server

*Label: collaborative. AI writes the workflow file, you read every line and
trace the flow. Then make a change and watch it deploy.*

### Checkpoint

You should be able to explain to someone: "When I push to main, GitHub Actions
runs my tests, builds two Docker images, pushes them to a registry, SSHs into
my server, pulls the new images, and restarts the containers. The whole thing
takes about 3 minutes."

If you can say that and mean it, Stage 6 from the learning plan is done.

---

## Phase 7 — Post-deployment

Once the app is live, stable, and monitored:

- [ ] **Test on real devices** — especially iOS Safari (this informs Stage 4 /
  PWA decisions)
- [ ] **Share with review panel users** — the personas in `docs/review/` can
  guide test scenarios
- [ ] **Watch Sentry and logs for the first week** — the first real users will
  find things you didn't
- [ ] **Decide on Stage 4 (PWA/offline)** — with a deployed URL you can now
  properly test service workers and iOS install prompts

---

## Summary: the order and why

| Phase | What | Why this order |
|-------|------|----------------|
| 0 | Privacy & bug fixes | Fix before anyone can access |
| 1 | Docker | Package the app so it's portable |
| 2 | VPS setup (manual) | Understand the server before automating |
| 3 | Nginx + HTTPS | Make it secure and accessible |
| 4 | Monitoring | See what breaks in production |
| 5 | Server hardening | Protect against automated attacks |
| 6 | CI/CD | Automate what you now understand |
| 7 | Post-deployment | Test, observe, decide next steps |

Estimated phases to a usable URL: 0-3 (after that, someone can open the app).
Phases 4-6 make it production-grade. Phase 7 is where Stage 4 (PWA) and
Stage 7 (polish + portfolio) decisions get made with real data.
