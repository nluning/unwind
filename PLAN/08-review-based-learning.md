# Review-based learning approach

## The idea

Instead of writing code and asking AI for help when stuck, AI writes the code
in small chunks and the developer reviews it. Understanding is verified through
targeted questions — both conceptual ("why does this work?") and practical
("what happens if you change X?").

## How it works

### 1. AI writes code in small chunks

Not a whole feature at once. One logical piece at a time — a migration, a
function, a route, a test. Each chunk is small enough to read in a few minutes.

### 2. Review before moving on

Read the code. No skimming. If something looks unfamiliar, say so before the
questions start — that's not failure, that's the point.

### 3. AI asks 2-3 questions per chunk

Questions fall into three types:

- **Why** — "Why do we hash the session token before storing it?" Tests
  conceptual understanding. The answer should be in your own words.
- **What if** — "What happens if you remove the `httpOnly` flag from the
  cookie?" Tests whether you understand consequences, not just steps.
- **Trace** — "A user clicks login. Walk me through what happens from the
  request hitting the server to the cookie being set." Tests whether you can
  follow the flow through the code.

### 4. Wrong or incomplete answers are fine

That's signal, not failure. AI explains, then asks a follow-up to check it
landed. No moving on until the concept clicks.

### 5. Retention check on the next occurrence

When a pattern repeats (e.g. the second route that uses the auth middleware),
predict what the code will look like before seeing it. This is the real test
of whether review-based learning sticks.

## When to break the pattern

If you say "I could write this one myself" — do it. The review approach
isn't a rule, it's a default. Writing code when you feel ready is always
better than reviewing code you already understand.

## Session log

Session logs are maintained in `PLAN/archive/session-log.md`.
