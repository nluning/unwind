# Swipe-up actiemenu op Verras-me

Issue: #98
Branch: `feat/suggest-swipe-menu`

## Context

On the Verras-me page (`SuggestPage`) a suggestion can currently only be
accepted (`Doen`) or skipped (`Volgende`). Users sometimes want to do more with
a suggestion: see more like it, never see it again, or talk it through with the
AI (e.g. "lees een boek" → *which* book? / "maak een kruiswoordpuzzel" → *where*?).

This adds a swipe-up gesture — plus a very inconspicuous, clickable handle for
desktop — that opens an action sheet on the current `ActivityCard` with three
actions:

1. **Meer van dit** — 3 suggestions anchored to the swiped activity, shown
   inline in the sheet (same card UX as SuggestFromList).
2. **Dit niet meer voorstellen** — deletes/hides the activity, advances to next.
3. **Chat hierover** — opens Mode 4 chat with a blank input; the activity rides
   along as hidden context, sent to Claude with the user's first message.

Note: chat's backend (`/chat/stream`) is live and registered, but `/chat` has
**no UI entry point** today (URL-only). "Chat hierover" becomes its first
contextual entry point — partial overlap with open issue #88 ("chatfunctie
terug"). The `chat.ts` "DEAD CODE" header is stale and will be corrected.

ADRs in scope: ADR-006 (Haiku for chat, Sonnet for suggest — models unchanged),
ADR-003 (raw parameterized SQL), ADR-010 (AI-generated Dutch activity content).

## Approach (inline results, recommended)

### Backend

**1. `generate.ts` — seed `/activities/suggest-from-list`**
- Add an optional body: `{ seed_activity_id?: string (uuid) }` via JSON schema.
- When present, look up the seed (`SELECT title, description, user_id FROM
  activities WHERE id = $1`). Reuse the visibility rule already in the DELETE
  handler (`activities.ts:217-245`): allow own (`user_id = userId`) or base
  (`user_id IS NULL`); otherwise treat as not found (ignore the seed / 404-style
  — drop seed and proceed generically rather than erroring the whole call).
- Pass `seed: { title, description }` into `buildSuggestFromListUserMessage`.
- Model stays `claude-sonnet-4-6` (ADR-006). Rate limiter unchanged.

**2. `suggestFromListPrompt.ts` — anchoring directive**
- Extend `SuggestFromListContext` with `seed?: { title: string; description: string | null }`.
- In `buildSuggestFromListUserMessage`, when `seed` is set, prepend an anchoring
  line and override the "roughly one familiar" guidance, e.g.:
  `"De gebruiker wil meer activiteiten in de geest van deze: '<title>' — <description>. Stel 3 activiteiten voor die hier qua sfeer/categorie dicht bij liggen, maar wel nieuw zijn."`
- System prompt const stays put; the directive lives in the user message
  (Claude follows it well, keeps the const stable).

**3. `chat.ts` + `buildSystemPrompt.ts` — hidden activity context**
- Add optional `activity_context: { title: string; description?: string }` to
  the shared `postBodySchema` (both `/chat` and `/chat/stream`).
- Thread it into `buildSystemPrompt(options)`; add a section when present:
  `"The user opened this chat from a specific suggested activity: '<title>' — <description>. They most likely want to talk about this. Help them with it concretely (a recommendation, a link, a next step)."`
- While reviving chat access: remove the stale `// DEAD CODE` banner and fix the
  self-documented Sentry blind spot in the `/chat/stream` catch — call
  `Sentry.captureException(err)` before writing the SSE error event (mirrors the
  parse-failure branches in `generate.ts`).

### Frontend

**4. `useSuggestFromList.ts` — seed param**
- `generate(seedActivityId?: string)` sends `{ seed_activity_id }` in the POST
  body when provided. Everything else (state, rate-limit handling) unchanged.

**5. `SuggestionList.vue` — extract shared card list (new, presentational)**
- Pull the `<li>` card markup + save/saved/saving logic out of
  `SuggestFromListPage.vue` into a reusable component.
  Props: `suggestions: AiActivity[]`. Emits/owns its own save flow via the
  passed `save` fn (or emits `save(index, activity)`).
- Refactor `SuggestFromListPage.vue` to use it (no behavior change there).

**6. `useChat.ts` — carry seed across navigation + send context**
- Add module-scoped `chatSeedActivity = ref<{ title; description } | null>` with
  exported `setChatSeed(activity)` (pattern mirrors `useSuggestionFlow`'s
  module state). Set by the action sheet before `router.push('/chat')`.
- `sendMessage(text, stressLevel?, activityContext?)` includes `activity_context`
  in the request body when present.

**7. `useSwipeUp.ts` — gesture composable (new, pure-ish, testable)**
- `touchstart`/`touchend` handlers tracking Y delta; fire `onSwipeUp` when an
  upward delta exceeds a threshold (also guard against horizontal scroll). No
  new dependency (none installed; consistent with "don't over-engineer").

**8. `ActivityActionSheet.vue` — the sheet (new)**
- Bottom-sheet overlay with backdrop. Two states:
  - **menu**: the three action buttons.
  - **results**: loading → `SuggestionList` (3 cards) → error/rate-limit
    (reuse `StateError` / `StateMessage`), for "Meer van dit".
- Props: `activity: Activity`. Emits: `delete`, `chat`, `close`.
- Close on backdrop tap, swipe-down, and `Escape`; `role="dialog"`, move focus
  in on open. UnoCSS + a slide-up transition (custom keyframe like the existing
  `uw-chat-typing` style if no utility fits).

**9. `SuggestPage.vue` — wire it up**
- Add an inconspicuous, clickable handle (small grabber bar, a `<button>` with
  `aria-label`) on/under the `ActivityCard`, and bind `useSwipeUp` to the card
  region. Both open the sheet for `current`.
- Wire sheet actions:
  - `delete` → `deleteActivity(current.id)` then close. Pool recomputes and the
    `useSuggestionFlow` watcher auto-advances `current` — no extra flow code.
  - `chat` → `setChatSeed({ title, description })` + `router.push('/chat')`.
  - "Meer van dit" handled inside the sheet via `useSuggestFromList`.

**10. `ChatPage.vue` — consume the seed**
- On mount, read `chatSeedActivity`, copy into local state, clear the module ref
  (so a later plain visit doesn't resurface it). Pass it as `activityContext`
  to `sendMessage` for the session; clear on `resetChat`.

**11. `nl.json` — new keys**
- `suggest.actions.more` = "Meer van dit"
- `suggest.actions.remove` = "Dit niet meer voorstellen"
- `suggest.actions.chat` = "Chat hierover"
- `suggest.actions.open` (handle aria-label) = e.g. "Meer opties"
- `suggest.actions.close` = "Sluiten"
- Reuse existing `suggestFromList.*`, `activity.duration`, `categories.*` for the
  inline results.

## Tests (alongside each chunk; follow /test skill)

- **Backend (pure, no Anthropic call):**
  - `suggestFromListPrompt`: `buildSuggestFromListUserMessage` includes the
    anchoring line when `seed` is set, generic copy when not.
  - `buildSystemPrompt`: includes the activity-context section when
    `activityContext` is set; absent otherwise.
- **Frontend (Vitest):**
  - `useSwipeUp`: fires on upward delta past threshold, ignores small/downward/
    horizontal moves.
  - `useSuggestFromList`: `generate(id)` posts `seed_activity_id`; `generate()`
    omits it (mock `api`).
  - `useChat`: `sendMessage` includes `activity_context` when passed; module
    `setChatSeed`/consume-and-clear behavior.
  - `ActivityActionSheet`: renders the three actions; emits `delete`/`chat`;
    switches to results state and renders cards; shows error/rate-limit.
  - `SuggestionList`: renders cards, save → saved transition.
- Note (issue #36): route-level tests that hit Anthropic are avoided; cover the
  prompt builders and the seed/ownership branch logic at unit level.

## Verification (end-to-end)

1. `cd backend && npm run typecheck && npm test`;
   `cd frontend && npm run lint:check && npm run test`.
2. Run the app (frontend + backend). On `/suggest`:
   - Swipe up on the card → sheet opens; confirm the handle also opens it by
     click (desktop).
   - **Meer van dit** → 3 seeded suggestions appear inline; "Toevoegen" saves
     and the card shows "Toegevoegd".
   - **Dit niet meer voorstellen** → activity disappears, next suggestion shows;
     reload confirms it stays gone (own = deleted, base = hidden).
   - **Chat hierover** → lands on `/chat` with empty input; type a question →
     Claude's reply reflects the activity (e.g. names a concrete book / link).
3. Sheet closes on backdrop tap, swipe-down, and Escape.

## Out of scope
- Re-adding a permanent chat link to the menu (issue #88) — only the contextual
  entry from this feature.
- Mobile-first restyling beyond what the sheet needs.
- GHCR retention / other open follow-ups.
