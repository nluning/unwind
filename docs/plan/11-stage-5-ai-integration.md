# Stage 5 — AI Integration (Mode 4 & Onboarding)

## Goal

Add AI-powered features: a chat-based activity suggestion mode (Mode 4) and
an onboarding conversation that generates a personalized starter activity list.
This is where the app goes from "useful tool" to "smart tool."

## Learning approach

Review-based learning continues. AI integration is new territory — almost
everything here is a new concept (Claude API, prompt engineering, streaming,
SSE). The default is **AI writes, you review** for all new-concept chunks.
🔧 try-first only appears where you're applying a pattern you've already
learned (writing a Vue composable, building a Fastify route structure, writing
tests).

**Understand deeply:** how system prompts shape model behavior, how token usage
drives cost, streaming mechanics, and privacy implications of sending user data
to an external API.

**Lookup:** Anthropic SDK API, streaming event types, SSE format.

---

## How to read this checklist

Each step is marked with one of three labels:

- **🔧 Try first** — attempt this yourself based on patterns from earlier stages.
- **📖 Lookup** — syntax, library APIs, config. Use docs or AI freely.
- **🛑 Don't DIY** — use the library/SDK as designed. Don't invent your own
  streaming protocol or prompt caching.

---

## Part A: Backend — Claude API proxy

### Step 1: Install the Anthropic SDK

📖 One dependency:

```bash
cd backend
npm install @anthropic-ai/sdk
```

Add `ANTHROPIC_API_KEY` to `.env` (and `.env.example` with a placeholder).

### Step 2: Chat endpoint — basic request/response

📖 **AI writes.** The route structure is familiar (POST endpoint + auth
middleware), but the Anthropic SDK integration is new. AI writes the full
chunk, you review.

Build `backend/src/routes/chat.ts`:

- `POST /chat` — protected route (reuse `requireAuth` middleware)
- Body: `{ messages: Array<{ role: 'user' | 'assistant', content: string }> }`
- Forwards to Claude API with a system prompt (see Step 4)
- Returns the assistant's response
- Use `claude-haiku-4-5-20251001` model for Mode 4

**Keep it simple first:** no streaming, no structured output, no rate limiting.
Get a round-trip working, then layer on features.

**Review:** `/review` workflow applies — 2-3 questions after reviewing the code.

### Step 3: Environment and error handling

📖 **AI writes.** Error handling for an external API is a new pattern — you
haven't dealt with proxying to a third-party service before.

- Return 503 if the Claude API is unreachable or returns an error
- Return 429 if rate limited by Anthropic
- Log token usage from the API response (`usage.input_tokens`,
  `usage.output_tokens`) via Pino — this is your cost visibility

### Step 4: System prompt for Mode 4

📖 This is prompt engineering — iterate with AI help. Start with:

```
You help neurodivergent users find a relaxing activity when they struggle to
switch off. Your tone is warm, calm, and low-pressure.

Rules:
- Ask simple questions with yes/no or max 3 choices
- Never ask open-ended questions
- Keep the conversation under 6 exchanges total
- Suggest one activity at a time with a specific duration
- Do not ask for personal information
- When suggesting an activity, include it in this JSON block:
  ```json
  { "title": "...", "description": "...", "category": "Head|Hands|Heart",
    "duration_minutes": N, "min_stress": N, "max_stress": N }
  ```

Context (injected per request):
- User's current stress level: {stress_level}
- Categories to avoid (already done today): {categories}


**Test the prompt** by running 5-10 conversations manually (via curl or a
simple script). Does it stay on track? Does it ask simple questions? Does it
produce valid JSON? Iterate before building any UI.

**Review:** `/review` workflow applies — questions will focus on prompt design
decisions, not syntax.

---

## Part B: Streaming

### Step 5: Server-Sent Events (SSE) streaming

📖 **AI writes.** SSE and the Anthropic streaming API are both entirely new
concepts. AI writes the full implementation, review focuses on understanding
the streaming lifecycle.

Modify `POST /chat` (or create `POST /chat/stream`) to:

- Use `client.messages.stream()` from the Anthropic SDK
- Set response headers: `Content-Type: text/event-stream`,
  `Cache-Control: no-cache`, `Connection: keep-alive`
- Forward each `content_block_delta` event to the client as an SSE event
- Send a final event with token usage when the stream completes

**Why streaming matters:** the user sees text appear word-by-word instead of
waiting 2-5 seconds for the full response. For a stressed user, a blank screen
with a spinner feels like the app is broken. Streaming feels responsive.

**Review:** `/review` workflow applies.

### Step 6: Frontend — chat composable

📖 **AI writes.** The composable structure is familiar, but reading an SSE
stream via `fetch()` + `ReadableStream` is new. AI writes, you review.

Create `frontend/src/composables/useChat.ts`:

- `messages` ref: array of `{ role, content }` objects
- `isStreaming` ref: true while waiting for / receiving a response
- `sendMessage(text)`: appends user message, calls the streaming endpoint,
  accumulates the assistant's response token-by-token into `messages`
- `resetChat()`: clears the conversation

Use `fetch()` with `response.body.getReader()` to read the SSE stream — this
gives you a `ReadableStream` you can process chunk by chunk.

**Review:** `/review` workflow applies.

---

## Part C: Mode 4 UI

### Step 7: Chat page — basic layout

🔧 **Try first** — this is a Vue component. You've built three mode pages
already; the layout pattern is the same.

Create `frontend/src/pages/ChatPage.vue`:

- Message list: scrollable area showing the conversation
- Quick-reply buttons at the bottom (not a free-text input initially)
- The AI asks questions with choices; the user taps a button to reply
- Assistant messages stream in word-by-word

Add the route to the router and enable the Chat tab in BottomNav.

### Step 8: Structured output — saving activities

📖 **AI writes** the JSON extraction logic (parsing LLM output is a new
pattern). 🔧 **Try first** for wiring the save button to `createActivity()`
— that's a known pattern from the composable you already built.

When the assistant's response contains a JSON activity block:

- Parse it out of the message content
- Show a "Save to my list" button on that message
- On tap: call `createActivity()` from `useActivities` (already built in
  Step 12 of Stage 3) with the parsed data mapped to `CreateActivityPayload`
- Show confirmation, then continue the conversation

Handle malformed JSON gracefully — the model won't always produce valid output.
Show the suggestion as text and skip the save button if parsing fails.

**Review:** `/review` workflow applies.

---

## Part D: Onboarding

### Step 9: Prototype the onboarding conversation

📖 **Do this before building any UI.**

Write a system prompt for onboarding that:

- Asks 4-5 simple questions about preferences (indoor/outdoor, alone/social,
  energy level, interests)
- Generates 10-15 personalized activities as a JSON array
- Each activity has: title, description, category, duration, stress range

Test it 5-10 times with different fake user profiles. Evaluate:

- Are the generated activities meaningfully different between users?
- Is the JSON consistently parseable?
- Does the conversation feel low-effort?

If the conversation approach doesn't produce good results, fall back to a
structured form + AI enrichment (user picks preferences via UI, backend sends
them to Claude as a single prompt to generate the list).

**Decision point:** conversation or form? Document the choice and why.

### Step 10: Onboarding backend endpoint

📖 **AI writes.** Batch inserting AI-generated activities with validation is a
new pattern. The route skeleton is familiar, but the parsing + bulk insert
logic is new.

- `POST /onboarding/generate` — takes the conversation history (or form data)
  and returns a list of activities
- Use `claude-sonnet-4-6` for onboarding (better at structured generation)
- Parse the JSON array response, validate each activity, insert into the
  database via batch `INSERT`
- Return the created activities to the frontend

### Step 11: Onboarding frontend flow

🔧 **Try first** — Vue component + routing logic. You've built conditional
flows before (auth guards, device login).

- Show onboarding after first device login (when user has 0 custom activities)
- Either: chat-style conversation using `useChat`, or a multi-step form
  (depending on Step 9 decision)
- On completion: activities are saved, user is redirected to Mode 1
- "Skip onboarding" option — user gets base activities only

---

## Part E: Cost controls

### Step 12: Rate limiting

📖 **AI writes.** Rate limiting is a new concept — you haven't built per-user
request tracking before. The middleware pattern is familiar, the counting
logic is new.

- Track requests per user per day in the database (or in-memory for now)
- Mode 4: max 10 conversations per day per user
- Onboarding: max 3 attempts per user (prevent abuse)
- Return 429 with a friendly message when limits are hit

### Step 13: Context window management

📖 **Lookup** — this is about token economics.

- Cap conversation context to last 4 exchanges (8 messages) for Mode 4
- Always include the system prompt (doesn't count toward the 4 exchanges)
- This keeps token usage predictable: ~500 input tokens per request max

---

## Part F: Tests

### Step 14: Chat endpoint integration tests

🔧 **Try first** for the test structure — same `fastify.inject()` pattern as
auth tests. 📖 **AI writes** the mock setup for the Anthropic client (mocking
an external SDK is a new pattern).

- Test the endpoint with a mocked Anthropic client (don't call the real API
  in tests — it costs money and is slow)
- Test error handling: what happens when the API returns an error?
- Test rate limiting: does the 11th request in a day return 429?

### Step 15: Structured output parsing tests

🔧 **Try first** — unit tests for the JSON extraction logic.

- Valid JSON block → parsed correctly
- Malformed JSON → returns null, doesn't crash
- Multiple JSON blocks → picks the first one (or the activity-shaped one)
- No JSON block → returns null

---

## i18n keys to add

```json
"nav": {
  "chat": "Chat"  // already exists, just enable the tab
},
"chat": {
  "heading": "Praat met Unwind",
  "placeholder": "Kies een optie...",
  "save": "Opslaan in mijn lijst",
  "saved": "Opgeslagen!",
  "rateLimit": "Je hebt je limiet voor vandaag bereikt. Probeer het morgen weer.",
  "error": "Er ging iets mis. Probeer het opnieuw.",
  "loading": "Aan het nadenken..."
},
"onboarding": {
  "heading": "Laten we je lijst personaliseren",
  "skip": "Sla over",
  "generating": "Activiteiten aan het genereren...",
  "done": "Klaar! {count} activiteiten toegevoegd."
}
```

---

## Chunk order

| Chunk | What                              | Dependencies | Files                           | Status |
|-------|-----------------------------------|:------------:|---------------------------------|--------|
| 1     | Claude SDK setup + basic endpoint | none         | `chat.ts` (new), `.env`        | ✅ Done |
| 2     | System prompt + manual testing    | 1            | `chat.ts`                       | ✅ Done |
| 3     | SSE streaming backend             | 2            | `chat.ts`                       | ✅ Done |
| 4     | Chat composable (frontend)        | 3            | `useChat.ts` (new)              | ✅ Done |
| 5     | Chat page + enable nav tab        | 4            | `ChatPage.vue` (new), router    | ✅ Done |
| 6     | Structured output parsing + save  | 4, 5         | `useChat.ts`, `ChatPage.vue`    | ✅ Done |
| 7     | Memory storage layer              | 1            | migration, `memory.ts` (new)    |        |
| 8     | Inject memories into system prompt| 7            | `buildSystemPrompt.ts`          |        |
| 9     | Onboarding prototype (prompt)     | 7            | scripts / manual testing        |        |
| 10    | Onboarding endpoint + UI          | 8, 9         | `onboarding.ts` (new), frontend |        |
| 11    | Rate limiting                     | 2            | middleware                      |        |
| 12    | Tests                             | all          | `tests/`                        |        |

Chunks 1-6 are the main path (Mode 4) — complete.

Chunks 7-8 are the memory storage layer, pulled forward from the AI memory
plan (see `12-ai-memory.md`). Only the backend storage + prompt injection is
built here — the user-facing memory management page (view/edit/delete/toggle)
stays in Stage 7 (polish). This reordering ensures the onboarding conversation
(Chunks 9-10) can seed user memories alongside generating activities, instead
of losing those preference signals.

---

## Definition of done

- [ ] `POST /chat` proxies to Claude API with a system prompt
- [ ] Streaming responses via SSE — text appears word-by-word in the UI
- [ ] Mode 4 chat page with quick-reply buttons, accessible via BottomNav
- [ ] AI-suggested activities can be saved to the user's list via `createActivity`
- [ ] `user_memories` table + CRUD endpoints for backend storage
- [ ] Memories injected into system prompt (activity history + conversational facts)
- [ ] Onboarding flow generates 10-15 personalized activities AND seeds user memories
- [ ] Rate limiting: max 10 Mode 4 conversations/day, max 3 onboarding attempts
- [ ] Token usage logged per request
- [ ] Graceful error handling: API down → friendly message, malformed JSON → skip save
- [ ] All strings through vue-i18n (Dutch)
- [ ] Integration tests for chat endpoint (mocked API) and parsing logic
- [ ] You can explain: how streaming works (SSE), how system prompts shape behavior,
      how token usage drives cost, what data is sent to the external API
