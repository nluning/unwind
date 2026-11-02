---
name: project_anonymous_users_rethink
description: Noor wants to reconsider storing anonymous (device-login) users server-side; deferred 401 re-auth fix for offline mode depends on that outcome
metadata:
  type: project
---

Noor is unsure why anonymous device users are persisted in the database at all, and suspects it fills with users who open the app once (raised 2026-11-02, during plan 29 chunk 6). To be reconsidered before more is built on top of anonymous accounts (ADR-012 is device-first).

**Deferred follow-up (plan 29):** a 401 on the outbox flush redirects anonymous users to `/login` (`client.ts` 401 handler) instead of silently re-running `deviceLogin`, as an online boot would. Entries are kept and sent after a reload, so no data is lost. Session lifetime is 30 days, so this is rare. The fix would change the shared 401 behaviour, so don't build it until the anonymous-user question is settled.

**Why:** the fix may change shape or disappear if anonymous users are stored differently (or cleaned up).

**How to apply:** when touching anonymous auth, the device-login flow or the offline 401 path, raise this first. Related: [[project_status]].




Claude says 2/11/2026:
  I haven't re-read ADR-012, so this is from the code and the design as I understand it. As far as I can
  tell, the server needs a row for an anonymous user because activities, usage_events and the rate-limit
  table all have a user_id foreign key. The device login also exists so that a user's data survives across
  visits without an account, and so that /auth/upgrade can later turn the account into an email one.

  Your clogging worry is fair, and it doesn't require removing anonymous accounts. There are three cheaper
  options:
  1. Create the account lazily. Don't register on first open. Do it only when the user first saves something,
     like an activity or an event. A visitor who just looks around costs nothing.
  2. Run a cleanup job. Periodically delete anonymous users who have no activities and no events and haven't
     been seen for N days.
  3. Keep everything local until upgrade. This is the most radical option. Offline mode is already halfway
     there, since the outbox and snapshot live on the device.

  Option 2 is the least invasive and wouldn't touch the auth flow. Option 1 changes /me and the router guard,
  so it's the bigger decision.