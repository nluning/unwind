# Plan 28: post-activity feedback + personal stats

Issue: #115

## Context

Users accept an activity and then leave the app; we never learn whether it helped, and they get no moment of reflection. We want to ask "hoe voelde je je daarna?" (beter / hetzelfde / slechter) the next time they open the app, plus a stats page that is visible only to the user.

**Why server-side:** the PWA is often evicted while the phone is put away, so a cold start lands on `/` → `/suggest`, not on 'tot zo'. Client memory can't be trusted; the `accepted` usage event already lives in the DB, so the server can say "this user has an unanswered accepted event".

Findings that shape the plan:
- `usage_events` (001_initial_schema.sql) already stores `accepted` events per user, cascades on user delete (so `DELETE /me` already wipes feedback). `stress_level_after` exists but is a different measure; we add new columns instead.
- `POST /usage-events` (backend/src/routes/activities.ts:179) returns only `{ ok: true }` and is called fire-and-forget from three places: `useSuggestionFlow.logEvent`, `ChatPage.handleAccept`, `SuggestionList.handleAccept`.
- 'Tot zo' is `components/SuggestionAccepted.vue` (used by SuggestPage, StressPage, CounterbalancePage) and an inline `suggest.accepted` text in ChatPage.
- Dialog convention: `ActivityActionSheet.vue` (`role="dialog" aria-modal`, focus on mount, `@keydown.esc`). Activity titles are rendered through `useActivityTranslation().titleFor()`.
- ADR-007 says offline actions are queued, but no queue exists in the code (plain `fetch` in `api/client.ts`). We don't build one; feedback calls are best-effort. #99 (retire `usage_events.mode`) is untouched.
- ADRs read: 003 (raw SQL, parameterized, hand-written migrations), 007, 012. No new ADR needed.

## Backend

1. **Migration `010_usage_event_feedback.sql`** — `ALTER TABLE usage_events ADD COLUMN outcome TEXT CHECK (outcome IN ('better','same','worse')), ADD COLUMN outcome_at TIMESTAMPTZ, ADD COLUMN feedback_dismissed_at TIMESTAMPTZ`. No index (~100 users).
2. **`POST /usage-events`** → `INSERT … RETURNING id`, respond `201 { ok: true, id }` (keeps `ok`).
3. **New `backend/src/routes/feedback.ts`**, registered in `app.ts`, all with `requireAuth` and `user_id` from the session:
   - `GET /me/pending-feedback` — take the user's **latest `accepted` event**; return it (`{ id, activity: { id, title, source } }`) only if `outcome IS NULL AND feedback_dismissed_at IS NULL` and age is between `FEEDBACK_MIN_AGE_MINUTES = 5` and `FEEDBACK_MAX_AGE_HOURS = 24` (named constants at top of file); otherwise `{ pending: null }`. Older unanswered events expire silently.
   - `PATCH /usage-events/:id` — body `{ outcome }` **or** `{ dismissed: true }` (schema `oneOf`). `UPDATE … WHERE id=$1 AND user_id=$2 AND action='accepted' AND outcome IS NULL AND feedback_dismissed_at IS NULL`; 404 if nothing updated (not yours / already handled).
   - `GET /me/stats` — only rows with `outcome IS NOT NULL` for the session user. Returns `{ byActivity: [{ id, title, source, better, same, worse }] }` via `COUNT(*) FILTER (WHERE outcome = …)`. Ranking is done on the client. (Originally also `total` and `byCategory`; dropped when the stats page was simplified to "which activities work best / worst".)
4. **Privacy:** no admin/aggregate endpoint; verify `errorHandler.ts` and Sentry setup don't attach request bodies, and that nothing logs `outcome`.

## Frontend

1. **`composables/usePostActivityFeedback.ts`** (module-level state, like `useSuggestionFlow`):
   - `target` ref `{ eventId, activity }` → drives the interstitial.
   - `trackAccepted(activity, eventPromise)` remembers the last accept; `openForLastAccepted()` (the 'klaar' button) awaits the id and sets `target` immediately, no time threshold.
   - `checkPending()` → `GET /me/pending-feedback`; no-op if `target` is already open, if offline (`navigator.onLine`, avoids Sentry noise), or within ~1 s of the previous check (debounce).
   - `answer(outcome)` / `dismiss()` → `PATCH`, close optimistically, errors swallowed (best-effort).
   - Reset on logout next to `resetSuggestionFlowState()`.
2. **App-level trigger in `App.vue`:** on mount (cold start) and on `visibilitychange` (→ visible), `pageshow`, `focus` call `checkPending()`; skip on `route.meta.public` / `onboarding` routes; remove listeners on unmount.
3. **`components/FeedbackInterstitial.vue`**, mounted once in `App.vue` (`v-if="target"`): follows the `ActivityActionSheet` dialog pattern — `role="dialog" aria-modal`, labelled by the question, focus moved in on mount and restored to the previously focused element on close, Escape, an X button top right (`aria-label` "Overslaan", last in tab order) and a tap on the backdrop all dismiss (like `ActivityActionSheet`), no timers, no animation that shifts layout. Question: "Hoe voel je je nu?" with "Na *activity*" (title in italics) as a quiet one-line reminder. Three round neutral pictogram buttons, left to right slechter / hetzelfde / beter: chevron down, wave, chevron up. No visible captions: labels live in `aria-label`. Only the sign is coloured, muted (beter = green, hetzelfde = neutral, slechter = orange, never red); the shape carries the meaning. Run the `/accessibility` skill checklist when building.
4. **Hook up accepts:** `useSuggestionFlow.logEvent` returns the POST promise and, for `accepted`, calls `trackAccepted`. `SuggestionAccepted.vue` gets a "Klaar" button next to "Terug" that calls `openForLastAccepted()` (component uses the composable directly, so the three pages need no change). ChatPage's inline 'tot zo' gets the same button (it registers via `trackAccepted`). `SuggestionList` (AI lists) only needs the server-side event, so it stays unchanged: the resume prompt still works for it.
5. **Stats:** `pages/StatsPage.vue` + route `/stats` (name `stats`) + menu link in `UserMenu.vue` (new group entry next to account). `composables/useStats.ts` calls `GET /me/stats`; uses `PageShell`/`PageHeader` and `StateLoading`/`StateError`/`StateMessage` for loading/error/empty. Two short lists, "Werkt goed" and "Werkt minder", ranked by score (better − worse; activities with no clear difference are left out). Each list shows its top 3 by default; "Meer laten zien" (toggling to "Minder laten zien", `aria-expanded`) reveals the rest, per list. Each row is the activity title (`titleFor`) plus the same coloured signs as the question, one per answer that happened, with the count; screen readers get the full phrase. Rows sit on the light card surface so the orange sign stays readable on the warm theme. Title uses the app's `uw-title`. No intro text, percentages or charts.
6. **Copy (`locales/nl.json`, the only locale):** new `feedback.*`, `stats.*`, `suggest.done`, `menu.stats`; `PrivacyPage.vue`: extend `storeUsage` and add `storeFeedback`: how you felt after an activity, shown only to you in your own overview, "wij kijken hier niet naar", not shared with AI; deleted with your account.

## Tests (written alongside each chunk)

- **Backend integration** `backend/tests/Integration/feedback.spec.ts` (pattern from `account.spec.ts`; backdate `created_at` via SQL): POST returns id; pending → null when too young / >24h / answered / dismissed; only the latest accepted event is considered; PATCH answer, dismiss, other user's event → 404, double-answer → 404, invalid outcome → 400; stats scoped to the session user (two users), excludes skipped/dismissed, category counts. `truncateAll` needs no change (same table).
- **Frontend** (follow `/test` skill): `usePostActivityFeedback.spec.ts` (checkPending opens, doesn't override, debounce, offline guard, answer/dismiss PATCH + close, `openForLastAccepted` awaits the id), `FeedbackInterstitial.spec.ts` (buttons, Escape, Overslaan, focus), `SuggestionAccepted.spec.ts` (Klaar), `useSuggestionFlow.spec.ts` (accept registers last accepted), `StatsPage.spec.ts` (loading / empty / error / populated).

## Order of work (small chunks, tests with each)

1. Migration + POST returns id + feedback routes + backend tests
2. `usePostActivityFeedback` + wiring in `useSuggestionFlow` + tests
3. `FeedbackInterstitial` + App.vue listeners + Klaar buttons (SuggestionAccepted, ChatPage) + tests
4. Stats consumer: `useStats`, `StatsPage`, route, menu link + tests
5. Privacy copy and `.claude/project_status.md`

## Known edges (accepted)

- 'Klaar' tapped before the accept POST resolves → we await it; if the POST failed the button does nothing (Sentry captures the error via `api()`).
- Only the latest accepted event is ever asked about; a quick second accept makes the first expire.
- No offline queue for answers (ADR-007 gap, pre-existing).

## Verification

- `cd backend && npm test` (needs Postgres), `cd frontend && npm test`, `npm run lint:check`, `vue-tsc`, `vite build`.
- Manual: accept an activity → `UPDATE usage_events SET created_at = now() - interval '15 min'` → switch tab away and back → interstitial appears; answer → doesn't reappear; accept again → 'Klaar' opens it instantly; Overslaan → never asked again; `/stats` shows only own counts; a second account sees none of them; delete account removes the rows.
