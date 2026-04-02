# ADR-008: VPS over managed hosting

## Status: Accepted

## Context

The app needs to be deployed somewhere. Options: managed platforms (Vercel,
Railway, Heroku) or a VPS with Docker. Managed platforms are faster to set up but hide infrastructure. Understanding
what happens between `git push` and the user seeing the update matters.

## Decision

Docker on a VPS. Hetzner, ~4 EUR/month, Dutch data center. Deploy early
(Stage 0 hello world) and incrementally, not everything at once.

The stack on the VPS: Linux, Docker Compose, nginx as reverse proxy, HTTPS via
Let's Encrypt. CI/CD through GitHub Actions: push, test, build image, deploy.

## Consequences

- Full control over infrastructure and real-world operational experience (Linux, networking, SSL, process management).
- More maintenance than managed hosting: disk monitoring, process supervision, SSL renewal, security updates.
- Server hardening needed (ufw, fail2ban, SSH keys only).
- Dutch data center aligns with privacy principles and GDPR requirements.
- The tradeoff is explicit: more operational work, but full understanding of
  the deployment pipeline.
