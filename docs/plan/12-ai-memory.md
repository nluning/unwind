# AI Memory & Personalization

## Goal

Make Mode 4 conversations feel personal and informed over time. The AI should
remember what it learns about the user across conversations, and use their
activity history to make better suggestions. The user should always be able to
see, edit, and delete what the AI "knows" about them.

## Why this matters

Without memory, every Mode 4 conversation starts from zero. The AI asks the
same questions, makes the same generic suggestions, and never builds a
relationship with the user. With memory, the 10th conversation is meaningfully
better than the 1st — the AI already knows the user prefers indoor activities,
has ADHD, and finds knitting calming.

This is also a strong portfolio/interview talking point: it demonstrates
understanding of LLM context management, privacy-first design, and the
boundary between what an AI should remember vs. what the user controls.

---

## Two types of memory

### 1. Activity history (structured — already exists)

Data from `usage_events` and `activities` tables:

- Which activities the user has accepted, skipped, or been suggested
- Accept/skip ratios per activity
- Categories the user gravitates toward or avoids
- Time-of-day patterns (if tracked)

**How it gets used:** The backend queries this data before each chat request
and injects a summary into the system prompt. Example:

```
User's activity patterns:
- Frequently accepts: reading, puzzles, drawing (Head/Hands)
- Frequently skips: outdoor walks, group activities
- Most active category: Head
- Activities done today: [list from usage_events]
```

**Implementation:** No new tables needed. Write a query that summarizes the
user's usage patterns and format it as prompt context. This can be added to
the current Stage 5 work without major changes.

### 2. Conversational memory (new — needs design)

Facts the AI learns during chat that aren't captured in structured data:

- Neurodivergence type ("I have ADHD and autism")
- Sensory preferences ("loud noises stress me out")
- Living situation ("I live in a small apartment")
- What helps them ("breathing exercises work for me")
- What doesn't work ("I can never start a creative project when stressed")
- Interests and hobbies beyond the activity list

**These are sensitive, personal data.** Design must be privacy-first.

---

## Database design for conversational memory

```sql
CREATE TABLE user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fact TEXT NOT NULL,           -- "Has ADHD and autism"
    source TEXT NOT NULL,         -- 'ai_learned' or 'user_added'
    conversation_id UUID,        -- which chat session created this (nullable)
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Key decisions to make:**

- **Flat facts vs. structured categories:** Start with flat text facts (simpler,
  more flexible). Consider categorizing later (e.g., "sensory", "diagnosis",
  "preference") if retrieval needs it.
- **How many facts to store:** Cap at ~20-30 per user. Prompt context has
  limits, and more facts = more input tokens = more cost.
- **Deduplication:** The AI might learn "likes reading" in multiple
  conversations. The backend (or the AI itself) needs to merge/update rather
  than duplicate.

---

## How the AI writes memories

Two approaches (decide during implementation):

### Option A: AI extracts facts in a post-processing step

After each conversation ends, send the full conversation to Claude with a
prompt like: "Extract any new facts you learned about this user. Return as
a JSON array of strings." Then store them.

- Pro: clean separation, doesn't interrupt the chat flow
- Con: extra API call per conversation, slight cost increase

### Option B: Tool use — AI calls a "remember" function

Give Claude a tool/function it can call during the conversation:
`remember({ fact: "User has ADHD" })`. The backend handles storage.

- Pro: real-time, AI decides what's worth remembering in context
- Con: more complex to implement (requires tool use in the Claude API),
  AI might over-remember or remember wrong things

**Recommendation:** Start with Option A (simpler). Move to Option B if the
post-processing approach misses too many facts or if tool use becomes relevant
for other features.

---

## How memories get injected into prompts

Before each Mode 4 request, the backend builds context:

```
What you know about this user (from previous conversations):
- Has ADHD and autism
- Prefers indoor, quiet activities
- Finds knitting and puzzles calming
- Lives in a small apartment with a partner
- Doesn't like being told to "just go for a walk"

Activity patterns:
- Frequently accepts: reading, puzzles, knitting
- Frequently skips: outdoor walks, group activities
- Done today: [reading, drawing]
```

This goes into the system prompt alongside the behavioral rules.

**Token budget:** Keep the memory section under ~200 tokens. At 20-30 short
facts, this is achievable. The activity summary should also stay under ~100
tokens. Total context overhead per request: ~300 extra input tokens.

---

## User control (critical)

The user MUST be able to:

1. **View** everything the AI "remembers" about them
2. **Edit** any fact (correct mistakes)
3. **Delete** individual facts or clear all memory
4. **Pause memory** — opt out of the AI learning new facts, without deleting
   existing ones

### UI concept

A "What Unwind knows about me" page accessible from settings:

- List of facts with edit/delete per item
- "Add something" button (user can tell the AI something directly)
- "Clear all" with confirmation
- Toggle: "Let Unwind learn from our conversations"

### Privacy considerations

- All memory is per-user and never shared
- `ON DELETE CASCADE` ensures account deletion removes all memories
- The AI should never reference memories in a way that feels surveillance-like
  ("I noticed you've been stressed a lot lately"). Keep it natural and helpful.
- Consider: should the AI tell the user when it remembers something new?
  Transparency builds trust. ("I'll remember that you prefer quiet activities.")

---

## Dependencies

- Stage 5 (current) must be complete — the chat endpoint needs to work first
- Activity history injection (type 1) can be added during Stage 5
- Conversational memory (type 2) is a separate feature, likely Stage 7 (polish)
  or its own mini-stage

## Chunk order (when implemented)

| Chunk | What |
|-------|------|
| 1 | Activity history query + injection into system prompt |
| 2 | `user_memories` migration + CRUD API endpoints |
| 3 | Post-conversation fact extraction (Option A) |
| 4 | "What Unwind knows" settings page |
| 5 | Memory toggle + privacy controls |
| 6 | Tests |

---

## Open questions

- Should the onboarding conversation (Step 9-11 in Stage 5) also generate
  initial memories? It learns preferences — those could seed the memory.
- How do we handle contradictions? ("I like outdoor activities" vs. earlier
  "I prefer staying indoors") — last-write-wins, or flag for user review?
- Should there be a "memory quality" feedback loop? User can mark a fact as
  wrong → AI learns to be more careful about similar assumptions.
