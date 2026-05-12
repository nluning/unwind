# ADR-012: Device-first auth, account as upgrade

## Status: Accepted (2026-05-12)

## Context

The original auth model presented a login wall: a new visitor's first
screen was `/login` with email/register/use-without-account as three peer
choices. Device-anonymous auth existed (`POST /auth/device`) and a
device-to-email upgrade path existed (`POST /auth/upgrade`), but the wall
was the default entry point.

For an app whose explicit target audience is users who opened it *because
they can't make decisions* (see `docs/review/reports/001-general-concept.md`
— "navigation itself is keuzestress" flagged by 6/7 personas), a login
gate is the same anti-pattern at an earlier moment. The user has to
choose how to authenticate before the app has given them any reason to
authenticate at all.

`docs/review/reports/002-onboarding-source-choice.md` walks through the
design space; the chosen direction is to delete the gate, not redesign
it. ADR-004 already names the device flow and upgrade path as part of
the auth design — this ADR records the decision to make device-anonymous
the *default* path, not an alternative.

## Decision

A new visitor is automatically given an anonymous device-scoped account
on first app load. The flow:

1. App boot calls `useAuth.initialize()`. If the session cookie is
   missing or invalid (`/me` returns 401), the boot sequence reads or
   creates `unwind-device-id` in localStorage and calls
   `POST /auth/device`. The visitor lands on `/suggest` with a valid
   session and the base activity library available.
2. Login and registration are reachable from the menu as
   *Maak een account*, not from a gate. For an anonymous user this
   route exposes the existing `POST /auth/upgrade` flow, which adds
   email + password to the *same* user row — no data migration, no
   activity loss.
3. The `/login` route remains for the email-login case (existing users
   returning on a new browser) but is not the default destination of
   any unauthenticated request.
4. Onboarding stops being a gate. The router no longer redirects on
   `needsOnboarding`. The onboarding generate endpoint remains, but is
   invoked from a menu action ("Verzin activiteiten voor me") rather
   than from a forced first-run flow.

## Consequences

### Positive

- **Two taps to a suggestion** from cold-open, matching the app's mission
  to help people who cannot make decisions. The 001 panel's strongest
  cross-persona finding (gate friction) is fully addressed.
- **Privacy posture improves.** The app no longer collects an email by
  default for a feature set that doesn't require one. For users who
  never upgrade, no PII is ever stored.
- **No new code paths.** `POST /auth/device` and `POST /auth/upgrade`
  already exist and are tested. This decision deletes gates, it doesn't
  add infrastructure.
- **Existing email users are unaffected.** Their cookies remain valid,
  `/login` still works, the upgrade route is gated on
  `email IS NULL` so it can't clobber a logged-in account.

### Negative

- **Data loss risk for users who never upgrade.** A device-anonymous user
  who clears their browser, switches phones, or loses the device loses
  their library. Acceptable for casual users with only base activities;
  painful for users who have invested. Mitigation: a contextual upgrade
  nudge once a user has accumulated custom activities or AI-generated
  ones (deferred — see plan/17 Phase 5).
- **Sync across devices stops being default.** A user who casually
  installs the app on phone and laptop will end up with two separate
  device-anonymous libraries. Same mitigation as above.
- **Login conversion drops.** Some users who would have signed up at the
  gate won't discover the upgrade flow. Aligned with mission ("help
  first, ask for commitment later") so this is treated as acceptable.
- **`users.onboarding_completed_at`** becomes vestigial. Kept for now
  for analytics; cleanup is deferred.
- **Mode 4 cold start.** Memory injection previously seeded user_memories
  during onboarding. Without that step, Mode 4's system prompt has less
  per-user context until the user invokes "Verzin activiteiten voor me"
  from the menu. Mode 4 is nobody's primary mode per 001 so this is
  acceptable, but it's a real regression for the few users who relied
  on it.

### Neutral

- **`DELETE /me` semantics unchanged.** Already cascades correctly for
  both anonymous and email users.
- **Rate limiting unchanged.** The 3-per-rolling-7-days bucket on
  `POST /onboarding/generate` continues to apply whether the route is
  hit at first-run or from the menu later. Anonymous users count the
  same as email users.
- **Sentry user context unchanged.** Already keyed on `user.id`, which
  exists for anonymous users too.

## Alternatives considered

- **Keep the gate, redesign onboarding as a tickbox source-choice
  screen.** Trades one rigidity for another (more decisions at low
  decision-capacity). See report 002 for the full panel analysis.
- **Auto-device-auth but keep onboarding as a gate.** Half-measure:
  removes the auth wall but not the configuration wall. Doesn't address
  the dominant 001 finding.
- **Device-anonymous via JWT in localStorage instead of httpOnly cookie.**
  Rejected — keeps cookie-based session auth per ADR-004 to preserve XSS
  protection.
