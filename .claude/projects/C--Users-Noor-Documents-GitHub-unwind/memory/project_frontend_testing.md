---
name: Frontend testing setup status
description: Assessment of frontend test infrastructure readiness — what exists, what's missing, and where to start. Written 2026-04-03.
type: project
---

## Frontend Testing — Readiness Assessment (2026-04-03)

### What's installed and ready
- Vitest 4.0.18, Vue Test Utils 2.4.6, jsdom 28.1.0 — all in devDependencies
- `npm run test:unit` script runs vitest
- `frontend/vitest.config.ts` — merges vite config, jsdom env, excludes e2e/
- Testing skill at `.claude/skills/test/TEST.md` — comprehensive guide covering behavioral testing, AAA structure, mock patterns, composable/component/page testing

### What needs to be created before first test
1. **`frontend/tests/` directory** with subdirs: `components/`, `composables/`, `pages/`
2. **`frontend/tests/setup.ts`** — shared setup (RouterLink stub, API client mock). Skill has the template.
3. **Update `frontend/vitest.config.ts`** — add `setupFiles: ['./tests/setup.ts']`
4. **Delete empty `frontend/src/components/__tests__/`** — contradicts the skill's `frontend/tests/` convention

### Testable surface (9 files)
| Layer | Files |
|-------|-------|
| Composables | `useActivities.ts`, `useAuth.ts`, `useSuggestionFlow.ts` |
| Components | `ActivityCard.vue`, `BottomNav.vue` |
| Pages | `SuggestPage.vue`, `StressPage.vue`, `CounterbalancePage.vue`, `LoginPage.vue` |

### Recommended starting order
1. `useActivities` composable — pure logic, no mounting, good first test
2. `ActivityCard` component — simple shared component
3. `useSuggestionFlow` composable — core business logic
4. Page components last — they depend on composable mocks

### Open question
- Verify `frontend/src/api/client.ts` exports match what the skill assumes (`api` as a single function). Read it before wiring up setup.ts.

**Why:** User wants to build frontend tests as part of Stage 5 work. No tests exist yet.
**How to apply:** Set up infrastructure first, then write tests composable-first.
