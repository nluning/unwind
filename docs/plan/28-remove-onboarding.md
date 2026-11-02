# Remove the onboarding feature — plan

**Status: IMPLEMENTED (2026-10-29), pending PR/merge.** Backend `tsc` + unit
tests, frontend `lint:check` + `vue-tsc` + `vitest` + `vite build` all pass
locally; the backend integration tests need Postgres and run in CI only.
Findings during implementation: the live AI flows both use `claude-sonnet-4-6`
(so ADR-006's Sonnet decision carries over), `createRateLimiter`'s `'week'` /
`'total'` windows are now unused, and `docs/learning/typescript-as-const.md`
still quotes the deleted `onboarding.ts` (left as a historical learning note).

Onboarding stopped being a gate in plan 17 /
ADR-012 and lost its last UI entry point (the "Verzin activiteiten voor me" menu
item) in plan 20 §1. Since then it has been reachable only by typing `/onboarding`.
This plan deletes it, renames the shared components that still carry its name, and
brings the docs in line.

## Why now

- The "10–15 AI-generated activities at onboarding" claim keeps surfacing in
  docs and conversations as if it were current behaviour. It isn't: no user can
  trigger it. The three live AI flows are `suggest-from-answers` ("Voor hier en
  nu", exactly 1 activity), `suggest-from-list` (`SUGGESTION_COUNT` activities)
  and nothing else generates in bulk.
- Dead code with a live-looking name misleads (and costs review attention).
  `backend/src/routes/onboarding.ts` already starts with `// DEAD CODE`.
- Memory consent no longer lives in onboarding — it is on the account page — so
  nothing else depends on the flow.

## What goes

**Backend**
- `src/routes/onboarding.ts` (`/onboarding/generate`, `/onboarding/skip`,
  `parseOnboardingResponse`) and `src/routes/onboardingPrompt.ts`.
- Route registration in `src/app.ts`.
- `scripts/test-onboarding.ts` and the `onboarding:test` script in `package.json`.
- Tests: `tests/Unit/parseOnboarding.spec.ts`, `tests/Integration/onboarding.spec.ts`,
  the onboarding cases in `tests/Integration/rateLimit.spec.ts` (the
  `/onboarding/generate` 429 tests and the "does not count onboarding usage" case),
  and the onboarding-prompt block in `tests/Unit/creativityGuidance.spec.ts`.
- `'onboarding'` from the `endpoint` union type in `src/middleware/rateLimit.ts`.
- Stale comment references (`chat.ts` mentions onboarding.ts parse branches).

**Frontend**
- `src/pages/OnboardingPage.vue`, its `/onboarding` route, and the
  `meta.onboarding` check in `App.vue` (only that page set it).
- The `src/pages/OnboardingPage.vue` entry in `vite.config.ts` coverage excludes.
- `needsOnboarding` in `useAuth.ts`, the stale localStorage-cleanup TODO, and its
  tests in `tests/composables/useAuth.spec.ts` / `AccountPage.spec.ts` mocks.
- The `onboarding` i18n namespace in `locales/nl.json`, after moving the three keys
  still in use (below).

## What gets renamed (still used by "Voor hier en nu")

| Now | After |
|---|---|
| `components/OnboardingOptionPills.vue` | `OptionPills.vue` |
| `components/OnboardingStepHeader.vue` | `QuestionStepHeader.vue` |
| `components/OnboardingStepActions.vue` | `StepActions.vue` (the page already imports it under that alias) |

Their specs under `tests/components/` rename with them, as does the
`QuickSuggestPage.spec.ts` import. i18n: `onboarding.back`, `onboarding.continue`
and `onboarding.questionOf` are the only keys used outside the deleted page; they
move to a new `steps` namespace (`steps.back`, `steps.continue`, `steps.questionOf`).
Also fix the `base.css:344` comment and the "like onboarding" comment in
`QuickSuggestPage.vue`.

## What stays (deliberately)

Anything that needs a production migration or touches stored data is **out of
scope** here and listed as a follow-up decision:

- `users.onboarding_completed_at` column, and its presence in the auth responses
  / `User` type. After this change nothing reads it. Dropping it means a
  migration plus touching `auth.ts`, `routes/auth.ts`, `db/types.d.ts` and the auth
  tests.
- `'onboarding'` in the `api_usage.endpoint` CHECK constraint and
  `user_memories.source` CHECK / the memory route enums. Existing rows carry those
  values; tightening the constraints needs a data decision first.
- Historical migrations 003/004/006/008/009 — never edited.

**Follow-up:** one migration that drops `onboarding_completed_at`, rewrites or
deletes `endpoint = 'onboarding'` usage rows, and narrows both CHECK constraints
(plus the memory enums). Decide separately.

## Docs

Rule: **current-state docs are corrected; dated history is left alone** (a plan or
review report describes what was true when it was written).

- Correct: `CLAUDE.md` (Stage 5 bullets), `README.md`, `.claude/project_status.md`,
  `docs/ops/logs.md`, any skill that describes onboarding as live
  (`.claude/skills/test`, `accessibility`, `prompt-test`).
- ADRs are append-only: add a short "Superseded / removed 2026-10-29" note to
  ADR-006 (the onboarding/Sonnet half) and keep ADR-012 as is; update the wording
  in `docs/adr/INDEX.md`.
- Mark plans 16 and 17 / 20 / 21 headers with a one-line "onboarding removed in
  plan 28" pointer where they describe the feature as pending; do not rewrite the
  bodies.
- Reviews (`docs/review/reports/*`, personas) and `docs/plan/archive/*`: untouched.
- Open point to verify while editing: ADR-006 says "Sonnet for onboarding". Check
  which model `suggest-from-answers` / `suggest-from-list` actually use, so the
  ADR note and CLAUDE.md "Key decisions" stay accurate.

## Order of work

1. Backend deletion + type/comment cleanup → `tsc` + `vitest` in `backend/`.
2. Frontend component renames + i18n key move → `vue-tsc` + `vitest`.
3. Frontend page/route/`meta`/`useAuth` removal → lint:check, `vue-tsc`, `vitest`,
   `vite build`.
4. Docs pass per the rules above.
5. Final repo-wide grep for `onboarding` / `Onboarding` / `10-15`; every remaining
   hit must be in history, a migration, or the "stays" list above.

## Verification

- CI-equivalent: backend `tsc` + `vitest`; frontend `lint:check` + `vue-tsc` +
  `vitest` + `vite build`.
- Manual: open "Voor hier en nu" and walk through the questions (pills, header,
  back/continue all render with the renamed components and new i18n keys);
  `/onboarding` now falls through to the router's not-found behaviour.
- Check `/health`-level smoke after deploy: no route registered for
  `/onboarding/*` (404), everything else unchanged.

## Risks

- **i18n key move** is the one place a typo fails silently (vue-i18n renders the
  key). The `QuickSuggestPage` / component specs should assert the rendered Dutch
  text, not just existence.
- **Deleted rate-limit tests** — confirm the remaining `rateLimit.spec.ts` cases
  still cover `createRateLimiter` for the live endpoints, so the middleware doesn't
  lose coverage by accident.
