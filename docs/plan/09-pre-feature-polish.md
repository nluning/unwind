# Pre-feature polish

Small UI/UX improvements before moving on to offline support and new features.
Goal: clean up navigation, improve chat, make the AI less overwhelming.

---

## 1. User menu component

The new home for settings and secondary navigation.
Replaces the floating ThemeSelector in the top-right corner.

- [x] Create `UserMenu.vue` component (dropdown)
- [x] Add menu trigger in `App.vue` (icon top-right, replaces ThemeSelector)
- [x] Integrate existing ThemeSelector inside the menu
- [x] Add links to Stress and Balance pages in the menu
- [x] Visual design: fits the current theme system

## 2. Simplify bottom nav

Stress and Balance are modes, not top-level destinations.

- [x] Remove Stress and Balance tabs from `BottomNav.vue`
- [x] Bottom nav contains only **Suggest** and **Chat**
- [x] Routes `/stress` and `/counterbalance` remain (accessible via user menu)

## 3. Logout

- [x] Add logout button in the user menu
- [x] Calls `useAuth().logout()`
- [x] Redirect to `/login` after logout

## 4. Adjust AI prompt (no double questions)

The current `BASE_PROMPT` sometimes produces messages with multiple questions at
once. That's overwhelming for the target audience.

- [x] Update `buildSystemPrompt.ts`: explicitly "ask ONE question per message"
- [x] Add instruction: keep messages short (2-3 sentences max)
- [x] Add instruction: no double questions, no listing options unless asked

## 5. Conversation starters

Tappable buttons when the chat is still empty, so the user doesn't have to type.

- [x] Add 3-4 starter buttons to `ChatPage.vue` (shown when `messages` is empty)
- [x] Examples: "Ik ben gestrest", "Ik verveel me", "Ik kan niet stoppen met werken", "Verras me"
- [x] Tapping a button sends it as the first message
- [x] Add translations to `nl.json`

## 6. Markdown rendering in chat

The AI talks in markdown (bold, lists, etc.) but it currently shows as plain text.

- [x] Install a lightweight MD parser (`marked`)
- [x] Add XSS sanitization (`DOMPurify`)
- [x] Render assistant messages as HTML instead of `whitespace-pre-wrap`
- [x] Style MD elements inside chat bubbles (bold, lists, paragraphs)
- [ ] Test with various AI responses (lists, bold, code blocks, etc.)

---

## Known issues (not fixing now)

- **Onboarding flag is browser-scoped, not user-scoped.** `localStorage('unwind-onboarding-done')` persists across logouts. If a different user logs in on the same device, they skip onboarding because the previous user's flag is still set. Fix when adding proper per-user state management.

---

## Out of scope (later)

- **Response buttons** — buttons instead of typing for chat replies
- **Mobile-first styling** — deferred to a separate round
