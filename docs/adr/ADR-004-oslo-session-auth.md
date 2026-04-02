# ADR-004: Custom session auth with oslo crypto primitives

## Status: Accepted (revised — originally planned Lucia, which was deprecated)

## Context

Auth is security-critical. Building JWT handling entirely from scratch risks
real vulnerabilities in production. The app handles sensitive data (stress
levels, behavioral patterns), so auth must be correct for real users.

The original plan specified Lucia, a lightweight TypeScript auth library. Lucia
was deprecated in 2025 — its author converted lucia-auth.com into a guide for
implementing auth yourself using the `@oslojs/*` packages for crypto primitives.

## Decision

Hand-written session-based auth using oslo crypto packages:

- `@oslojs/crypto` for SHA-256 session token hashing
- `@oslojs/encoding` for token encoding
- `@node-rs/argon2` for password hashing

Session management, middleware, routes, device-based anonymous auth, and the
email upgrade flow are all written by hand. Only the cryptographic primitives
are delegated to libraries.

Refresh tokens stored in httpOnly cookies, not localStorage, to prevent XSS.

## Consequences

- No dependency on a framework or auth library — the auth layer is fully
  understood and fully controlled.
- Crypto primitives are handled by battle-tested packages (never hand-rolled).
- The middleware, session validation, and device-to-account upgrade flow are
  custom code that must be maintained.
- More surface area for bugs than a library-managed approach, mitigated by
  52 integration tests covering the full auth lifecycle.
