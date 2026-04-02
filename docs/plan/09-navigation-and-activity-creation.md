# Step 12: Navigation + activity creation

Two prerequisites before Stage 5 (AI integration).

---

## Chunk 1 — `createActivity` in useActivities composable

**Modify:** `frontend/src/composables/useActivities.ts`

Add a `createActivity` function that Mode 4 will call to save AI-suggested
activities to the user's list.

**What to build:**

- `CreateActivityPayload` interface — mirrors the backend's POST body (title,
  description, suggested_duration, min_stress_level, max_stress_level,
  category_ids)
- `CATEGORY_ID_MAP` constant — `{ Head: 1, Hands: 2, Heart: 3 }`. Coupled to
  `seed.sql`; documented with a comment. Exported so Mode 4 can also use it.
- `createActivity(payload)` function:
  - POSTs to `/activities` via the existing `api()` client
  - The backend responds with `RETURNING *` from the activities table — this
    does NOT include the joined categories array. Reconstruct category names
    from the ID map so the local `activities` ref stays consistent with what
    `GET /activities` returns.
  - Append to `activities.value` via spread (triggers Vue reactivity)
  - Return the enriched activity so the caller can use it immediately

**Why the category map is hardcoded:** The 3 categories come from a seed
script with `SERIAL` IDs. There's no admin UI to add categories. A
`GET /categories` endpoint is the right move if categories become
user-configurable — unnecessary now.

**Verify:** POST fires correctly, activity appears in suggestions without
page refresh, TypeScript compiles.

**Review:** `/review` workflow applies — 2-3 questions after reviewing the code.

---

## Chunk 2 — BottomNav component + i18n keys

**Create:** `frontend/src/components/BottomNav.vue`
**Modify:** `frontend/src/locales/nl.json`

**i18n keys to add:**

```json
"nav": {
  "suggest": "Suggestie",
  "stress": "Stress",
  "counterbalance": "Balans",
  "chat": "Chat"
}
```

**Component design:**

- `<nav>` element with `aria-label` for accessibility
- 4 tabs: modes 1-3 as `<router-link>` with `v-slot`, mode 4 as a disabled
  placeholder
- `router-link` with `v-slot="{ isExactActive, navigate, href }"` — gives
  active state detection for free without manual route watching, plus
  accessible `<a>` semantics
- Text-only labels for now (icons deferred to themes step)
- UnoCSS utility classes (this is new code, not a migration)
- Active tab: `text-primary font-600` + top border indicator
- Inactive tab: `text-muted`
- Chat tab: `opacity-40 pointer-events-none` + `aria-disabled="true"`
- Touch targets: `min-h-14` (56px) minimum — well above the 44px iOS guideline.
  Target audience is stressed/neurodivergent users; big targets matter.
- Fixed to bottom of viewport

**Verify:** 4 tabs render with Dutch labels, active indicator follows
navigation, chat tab is visually dimmed and not clickable.

**Review:** `/review` workflow applies.

---

## Chunk 3 — Wire nav into App.vue

**Modify:** `frontend/src/App.vue`

Transform the bare `<RouterView />` into a layout shell:

- Import `BottomNav` and `useRoute`
- `showNav = computed(() => route.meta.public !== true)` — reuses the existing
  `meta.public` convention from the router (login is the only public page)
- Wrap `<RouterView />` in a div with `pb-20` when nav is visible (prevents
  content being hidden behind the fixed nav bar — 80px matches the nav height)
- Render `<BottomNav v-if="showNav" />`

**Verify:**
- Login page: no nav
- Suggest/Stress/Counterbalance: nav visible, tabs navigate correctly
- Page content doesn't overlap with nav (scroll to bottom to check)
- Chat tab does nothing when tapped

**Review:** `/review` workflow applies.

---

## Chunk order

| Chunk | What                         | Independent? | Files                              |
|-------|------------------------------|:------------:|------------------------------------|
| 1     | `createActivity` composable  | yes          | `useActivities.ts`                 |
| 2     | BottomNav component + i18n   | yes          | `BottomNav.vue` (new), `nl.json`   |
| 3     | Wire into App.vue            | needs 2      | `App.vue`                          |

Chunks 1 and 2 are independent — can be built and reviewed in either order.
Chunk 3 depends on chunk 2.

---

## After all chunks

Full verification checklist:

1. `npm run dev` compiles without errors
2. Login page shows no navigation
3. After login, bottom nav appears with 4 tabs
4. Tapping Suggestie/Stress/Balans navigates to the correct mode
5. Active indicator follows the current tab
6. Chat tab is visually dimmed and does not navigate
7. Page content does not overlap with the nav bar
8. `createActivity` sends a correct POST and the new activity appears in
   suggestions without a page refresh

Once verified: update `CLAUDE.md` project status and move to Stage 5.
