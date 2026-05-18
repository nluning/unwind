# Account page

**Status: planned, not started.**

## What this document covers

A new `/account` page that consolidates everything a user does *to their
own data*: see how they're signed up (email or anonymous), manage their
stored memories, toggle whether memory is enabled at all, log out, and
delete their account. The page also replaces the menu's current
login/logout/delete-account entries with a single navigation link, so
the menu's Account group becomes pure navigation instead of a small
collection of buttons.

Background: Stage 5 introduced user memories (`user_memories` table,
`memory_enabled` consent flag, CRUD endpoints), and Stage 6 Phase 0
added `DELETE /me` and surfaced a delete-account button in the menu.
The menu restructure (plan/18) already labelled a group "Account" and
explicitly left open the question of whether that group should anchor a
real `/account` page once one existed. This plan answers that.

## Design decisions

- **One page, two audiences.** Same route serves anonymous users and
  email users. For anonymous users the "email" row reads "Je gebruikt
  Unwind anoniem op dit apparaat" and shows a `LinkButton` to
  `/login?mode=upgrade`. For email users the row shows the address and
  no upgrade affordance. No mode flag, no `v-if` ladder — just the
  email row's content swaps on `user.email`.
- **Anonymous → email upgrade keeps using `/login?mode=upgrade`.** The
  LoginPage already hosts that flow, the router already understands the
  `mode` query, and embedding a second copy of the form on `/account`
  would double the auth surface for no clear win. *Why this over an
  inline form:* duplicating an auth form is the kind of churn the
  scope-warning in `CLAUDE.md` is about — "don't over-engineer".
- **Memory editing is delete + add, not edit-in-place.** Memories are
  short factual statements; if one is wrong, the right action is to
  remove it, not to fine-tune wording. Skipping inline edit removes a
  pile of state (which row is editing, save/cancel buttons per row,
  unsaved-draft handling) for a feature whose value at 100 users is
  unclear. `PUT /memories/:id` stays in the backend unused for now —
  cheap to keep, cheap to wire up later if absence ever bites.
- **The memory-enabled toggle is destructive when turned off.**
  Disabling memory deletes every existing `user_memories` row for that
  user in the same transaction. Re-enabling later doesn't bring them
  back. *Why:* the consent semantics are "you've stored facts about me
  → stop". If we left the rows in place behind a flag, "memory off"
  would only mean "don't inject them in prompts," and the user's
  understanding of "disabled" wouldn't match the database. A
  ConfirmDeleteButton-style two-tap confirms the destructive intent.
- **Re-enabling is allowed and free.** Turning memory back on just
  flips the flag to true. No new memories appear automatically —
  Claude will only start storing facts again going forward (and the
  user can add their own via the form). No backfill, no surprises.
- **Logout moves off the menu and onto this page.** The menu becomes
  navigation only; the page owns every account-touching action. Logout
  is rare enough (people use Unwind on one device — the device-first
  auth assumes this) that one extra tap on a deliberate page is fine.
- **Delete-account also moves here, with the same `ConfirmDeleteButton`
  it already uses in the menu.** No new component; the existing
  two-tap confirm copy works as-is.
- **Privacy link stays in the menu.** It's a "read this" legal page,
  not an account action — moving it inside `/account` would make the
  page feel longer and the menu feel emptier without helping anyone.
  After this PR the menu's Account group has just two items: the
  Account link (this page) and Privacyverklaring.
- **No "export my data" button.** GDPR allows access requests via
  email (`privacy.contactExplanation` already points at the contact
  channel) and at 100 users a self-serve export is premature. Revisit
  if it shows up in user feedback.
- **Source label on memories is hidden.** Each memory has a `source`
  field (`ai_learned` | `user_added` | `onboarding`) but showing it to
  the user is bikeshedding — they don't care whether Claude wrote it
  or they did, they just want to confirm or remove it.

## What we are NOT doing here

- Inline edit of individual memories (delete + add only).
- A standalone "delete all memories" button. Toggling memory off
  already does that; a second button for the same outcome would just be
  noise.
- An inline upgrade form on the page (link to `/login?mode=upgrade`).
- Data export, password change, or email change. Out of scope for this
  PR — none of them are blockers for the feature's stated goal
  ("see what's stored about me, control it").
- Removing the `PUT /memories/:id` endpoint. It's two-dozen lines and
  may be useful later; leave it.
- Renaming `groupAccount` in the menu (it already reads "Account", and
  the Account link sitting under it now makes that label accurate).

## Code touch points

| File | Change |
|---|---|
| `frontend/src/pages/AccountPage.vue` (new) | The page itself. Three sections (email/auth, memories, danger zone). Uses `PageShell` + `PageHeader` + `LinkButton` + `ConfirmDeleteButton`. |
| `frontend/src/composables/useMemories.ts` (new) | `memories`, `loaded`, `error`, `fetchMemories`, `addMemory(fact)`, `deleteMemory(id)`. Mirrors the shape of `useActivities`. State is module-scoped so navigating away and back doesn't refetch. |
| `frontend/src/composables/useAuth.ts` | Add `memory_enabled` to the `User` interface (returned by `GET /me`). Add `setMemoryEnabled(enabled: boolean)` that calls the new endpoint and updates `user.value.memory_enabled` (and resets the in-memory memories list when disabling). |
| `frontend/src/router/index.ts` | Add `/account` route — auth-required, lazy-imported, like the other authed pages. |
| `frontend/src/components/UserMenu.vue` | Replace the createAccount / logout / ConfirmDeleteButton trio with a single `<router-link to="/account">`. Privacy link stays. Drop unused imports (`ConfirmDeleteButton`, `useRouter` if no longer used after handlers go). |
| `frontend/src/locales/nl.json` | Add an `account.*` block (heading, email/anonymous labels, memory section copy, toggle warning, logout/delete labels). Adjust `menu.*`: drop `createAccount`, `logout`, `deleteAccount`, `deleteConfirm` if they end up unused; add `menu.account`. |
| `backend/src/routes/auth.ts` | Include `memory_enabled` in the `/me` and login/register/device/upgrade response shapes (currently they return `id`, `email`, `onboarding_completed_at`). Add `PATCH /me` taking `{ memory_enabled: boolean }`. When set to `false`, run the flag update and the `DELETE FROM user_memories WHERE user_id = $1` in a single transaction. |
| `backend/src/routes/auth.ts` (or `middleware/auth.ts`) | Make `request.user` carry `memory_enabled` too so the route handler doesn't have to re-query. (Check what `requireAuth` currently attaches — if it's just id/email, leaving the `/me` route to do its own SELECT is fine and smaller.) |
| `backend/tests/Integration/account.spec.ts` (new) | Cover: `PATCH /me { memory_enabled: false }` deletes the rows in the same transaction; re-enabling doesn't restore them; non-auth gets 401. Reuse the test scaffolding from `memory.spec.ts`. |

## Dutch strings (draft)

```json
{
  "menu": {
    "account": "Account"
  },
  "account": {
    "heading": "Account",
    "emailSectionHeading": "Inloggen",
    "emailLabel": "E-mailadres",
    "anonymousLabel": "Je gebruikt Unwind anoniem op dit apparaat.",
    "anonymousHint": "Maak een account om je activiteiten en herinneringen op andere apparaten terug te vinden.",
    "createAccount": "Maak een account",
    "memorySectionHeading": "Wat Unwind over je heeft onthouden",
    "memorySectionIntro": "Unwind gebruikt deze notities om suggesties op jou af te stemmen.",
    "memoryEnabledLabel": "Herinneringen opslaan",
    "memoryDisableWarning": "Als je dit uitzet, worden al je opgeslagen herinneringen verwijderd. Dit kan niet ongedaan gemaakt worden.",
    "memoryDisableConfirm": "Ja, uitzetten en verwijderen",
    "memoryDisabled": "Herinneringen staan uit. Unwind onthoudt niets over je.",
    "memoryEmpty": "Er zijn nog geen herinneringen.",
    "memoryAddPlaceholder": "Schrijf iets wat Unwind over jou mag weten",
    "memoryAddButton": "Toevoegen",
    "memoryDeleteButton": "Verwijderen",
    "memoryDeleteConfirm": "Weet je het zeker?",
    "dangerSectionHeading": "Account",
    "logout": "Uitloggen",
    "deleteAccount": "Account verwijderen",
    "deleteConfirm": "Weet je het zeker? Dit kan niet ongedaan gemaakt worden."
  }
}
```

Final copy reviewed against `menu.deleteAccount` / `menu.deleteConfirm`
— same wording, easier to lift than to rewrite. After the menu strings
go unused they can be deleted (a `grep` pass at step 5 catches any
remaining references).

## API additions

**`PATCH /me`** — owns memory-enabled state changes.

Request body:
```json
{ "memory_enabled": false }
```

Behaviour:
- `false` → wrap in a single transaction: `UPDATE users SET memory_enabled = false` + `DELETE FROM user_memories WHERE user_id = $1`. Return `{ memory_enabled: false }`.
- `true` → `UPDATE users SET memory_enabled = true`. No side effects. Return `{ memory_enabled: true }`.

Why a single transaction matters: if the flag flips but the delete
fails (or vice versa), the user's UI shows "memory off" while rows
still sit in the database, which is exactly the consent-vs-storage
mismatch we're trying to avoid.

**`GET /me`** — extended to return `memory_enabled`. The frontend
relies on this to show the toggle state on first load. All other auth
endpoints (`/login`, `/register`, `/auth/device`, `/auth/upgrade`) get
the same treatment so the frontend's `User` shape is consistent
regardless of how the session was created.

`POST /memories` — no changes. Already enforces `memory_enabled`,
already caps at `MAX_MEMORIES_PER_USER = 30`, already returns the
inserted row. The page uses this verbatim for the add-form.

`DELETE /memories/:id` — no changes. Same.

## Page layout

```
[← back]                                                              [kebab]

Account
─────────────────────────────────────────────────────────────────────
INLOGGEN

  E-mailadres
  jane@example.com                          ← email user

  — or —
  Je gebruikt Unwind anoniem op dit apparaat.
  Maak een account om je activiteiten en herinneringen
  op andere apparaten terug te vinden.
  [ Maak een account ]                       ← anonymous user
─────────────────────────────────────────────────────────────────────
WAT UNWIND OVER JE WEET

  Unwind gebruikt deze notities om suggesties op jou
  af te stemmen.

  [ ●—— ] Herinneringen opslaan              ← toggle (off shown)

  When OFF: "Herinneringen staan uit. Unwind onthoudt niets over je."
  When ON:
    Lijst:
      • Ik werk graag in de tuin              [Verwijderen]
      • Concerten geven me te veel prikkels   [Verwijderen]
      ...
    [ tekstveld + Toevoegen ]
─────────────────────────────────────────────────────────────────────
ACCOUNT

  [ Uitloggen ]                              ← email user only
  [ Account verwijderen ]                    (two-tap confirm)
```

Anonymous users see no "Uitloggen" — logging out of an anonymous
device session would leave them stranded; the menu used to hide it for
this reason and the page should too.

## Step order

Small, reviewable chunks. Each step independently demoable.

1. **Backend: extend `/me` and the auth responses with
   `memory_enabled`.** Touch `auth.ts`, update the SELECT lists, ship
   it. No frontend changes — the field just starts arriving and gets
   ignored. Smoke-test by hitting `/me` and confirming the new field.

2. **Backend: add `PATCH /me`.** Implements the transactional flag +
   wipe behaviour. Integration test: enable memory, insert a few rows,
   PATCH to false, assert the rows are gone and the flag is false.
   Test re-enabling separately (no rows reappear).

3. **Frontend: `useMemories` composable.** Module-scoped state,
   `fetchMemories` / `addMemory` / `deleteMemory`. Verify in isolation
   by temporarily importing it in any existing page and rendering the
   list.

4. **Frontend: `AccountPage.vue` + route + i18n strings.** Mount the
   three sections wired to `useAuth` and `useMemories`. Logout and
   delete-account handlers copy-paste from the current `UserMenu`.
   Test all three sections by visiting `/account` directly.

5. **Frontend: menu surgery.** Replace login/logout/delete trio with a
   single `<router-link to="/account">`. Drop unused imports. Grep for
   `menu.createAccount`, `menu.logout`, `menu.deleteAccount`,
   `menu.deleteConfirm` — if no other consumer, remove from
   `nl.json` too. This is the chunk where things visibly change for
   existing users.

## Testing notes

- **Anonymous flow end-to-end.** Open app in a fresh browser → land on
  `/suggest` as anonymous → open menu → tap Account → page shows
  "anoniem" + create-account link → tap it → land on
  `/login?mode=upgrade` (existing flow) → complete upgrade →
  navigate back to `/account` → page now shows the email.
- **Memory disable wipes.** Onboarding-completed user with several
  memories. Toggle off → confirm → memories vanish from the list and
  from the DB. Toggle back on → list stays empty. Add a new memory →
  works. Toggle off again → it's gone again.
- **Memory cap interaction.** Add memories up to `MAX_MEMORIES_PER_USER`
  (30). The 31st `POST /memories` returns 409 with `Memory limit
  reached.` Page surfaces it as an error message under the form.
- **Logout from the page.** Tap logout → router pushes `/login` →
  reloading lands on `/login` (explicit-logout flag prevents
  re-anonymizing). Same behaviour the menu had.
- **Delete-account from the page.** Two-tap confirm → DELETE /me → all
  cleanup runs (cascade hits `user_memories`, `activities`, etc. — same
  path Phase 0 already tested) → router pushes `/login`.
- **Menu link presence regardless of auth state.** Anonymous *and*
  email users both see "Account" in the menu. Previously the menu
  branched (createAccount vs logout); now it doesn't — the page does
  the branching.
- **No regression on PrivacyPage.** The "controlDeleteAccount" string
  still reads "via het menu" — leave it as-is for this PR (the page
  IS in the menu, just one layer deeper). Open question below.

## Open questions

- **Privacyverklaring copy update?** Several strings on `PrivacyPage`
  point at "het menu" as the place to disable memory / delete the
  account. After this PR the literal control is on `/account`. A tiny
  follow-up could rewrite those lines to point at the account page.
  Out of scope here.
- **`upgrade()` in `useAuth` no longer reads `memory_enabled` back.**
  Currently it only patches `email`. Once step 1 adds `memory_enabled`
  to all auth responses we should make `upgrade()` patch the full new
  shape too, for consistency. Tiny; bundle with step 1 if cheap.
- **Should the toggle's destructive confirm use `ConfirmDeleteButton`
  or a one-off two-tap pattern?** The existing component is built for
  buttons that *delete the thing they sit on*. A toggle conceptually
  toggles, and the deletion is a side effect — semantically odd to use
  the same component. Probably worth a small `ConfirmToggle` variant,
  but a button styled the same way (the user taps "uitzetten" twice)
  is fine for v1.
