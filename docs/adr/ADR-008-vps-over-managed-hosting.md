# ADR-008: VPS over managed hosting

## Status: Accepted

## Context

The app needs to be deployed somewhere. Options: managed platforms (Vercel,
Railway, Heroku) or a VPS with Docker. Managed platforms are faster to set up
but hide infrastructure. This project's dual goal — build a useful app *and*
develop transferable skills — means understanding what happens between
`git push` and the user seeing the update is as important as the app itself.

## Decision

Docker on a VPS. Hetzner, ~4 EUR/month, Dutch data center. Deploy early
(Stage 0 hello world) and incrementally, not everything at once.

The stack on the VPS: Linux, Docker Compose, nginx as reverse proxy, HTTPS via
Let's Encrypt. CI/CD through GitHub Actions: push, test, build image, deploy.

### Why

- **Operational understanding.** Managed platforms abstract away Linux, nginx,
  SSL, and process management. These are exactly the things worth learning:
  they underpin every deployment, including managed ones. Debugging a failed
  Vercel deploy is easier if you know what nginx does.
- **Incremental deployment from Stage 0.** Deploying a hello-world endpoint
  in the first week means deployment is never a scary late-stage task. Each
  feature is deployed as it's built.
- **Cost and data residency.** ~4 EUR/month, Dutch data center. The app handles
  sensitive data (stress levels, behavioral patterns), so keeping it in a known
  jurisdiction matters.

## Consequences

- Full control over infrastructure and real-world operational experience
  (Linux, networking, SSL, process management).
- More maintenance than managed hosting: disk monitoring, process supervision,
  SSL renewal, security updates.
- Server hardening needed (ufw, fail2ban, SSH keys only).
- The tradeoff is explicit: more operational work, but the kind of operational
  understanding that makes every future deployment easier to debug.
