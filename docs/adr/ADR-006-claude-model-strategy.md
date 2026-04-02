# ADR-006: Claude Haiku for Mode 4, Sonnet for onboarding

## Status: Accepted

## Context

The app uses the Claude API for two distinct features:

1. **Mode 4 — guided chat.** An interactive conversation that helps the user
   discover what kind of activity they need right now, through short yes/no
   style questions.
2. **Onboarding.** A one-time flow that generates a personalized starter list
   of 10-15 activities based on user preferences.

These features have different quality requirements and usage frequencies. The
question is which Claude model to use for each.

## Decision

Use Claude Haiku for Mode 4 conversations and Claude Sonnet for the onboarding
flow. All API calls are server-side only — the API key is never exposed to the
client.

### Why

- **Mode 4 (Haiku):** The conversation follows a guided structure with short,
  constrained questions. Haiku's quality is sufficient for this pattern and it
  is significantly cheaper per token. Mode 4 is used more frequently than
  onboarding, so cost matters here.
- **Onboarding (Sonnet):** Generating a personalized activity list requires
  higher quality output — understanding user preferences, producing correctly
  structured data, and writing natural Dutch descriptions. This runs once per
  user, so the higher per-call cost is negligible.

### Privacy constraints

The LLM receives minimum context: stress level, categories to avoid, and recent
suggestions. It never receives user IDs, email addresses, or raw behavioral
data. Conversation context in Mode 4 is capped to the last 4 exchanges to limit
what the model sees at any point.

### Cost controls

Estimated cost: under 10 EUR/month at ~100 users. Controls in place:

- Per-user rate limits on Mode 4 conversations.
- Conversation length caps (max exchanges per session).
- Onboarding runs once per user, not on every login.

## Consequences

- Two-tier model strategy keeps costs low while using higher quality where it
  matters (onboarding output).
- Privacy constraints limit personalization depth — the model can't learn long-
  term patterns about a user. This is an intentional tradeoff that matches the
  app's sensitive-data principles.
- If Haiku's quality proves insufficient for Mode 4 (unlikely given the guided
  format), upgrading to Sonnet is a one-line config change with a predictable
  cost increase.
- Server-side only means no API key risk, but also means Mode 4 requires an
  internet connection (unlike modes 1-3 which work offline).
