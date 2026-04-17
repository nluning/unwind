# Data access and privacy when self-hosting Unwind

## Short answer

When Unwind is deployed and real users sign up, **yes — full read/write access
to everything** is available to whoever holds the VPS credentials. Because
Unwind is self-hosted (Docker on a VPS per ADR), the operator *is* the
database administrator. Nothing stops:

```bash
ssh you@your-vps
docker exec -it unwind-db psql -U postgres
SELECT * FROM users;
SELECT * FROM user_memories;
SELECT * FROM chat_messages;
```

Every row is visible — emails, hashed passwords, stress levels, conversation
transcripts, behavioral patterns.

This isn't a Fastify or Postgres thing — it's just how self-hosted apps work.
A managed service (Supabase, Neon, AWS RDS) would only trade one holder for
another; the *provider* would still have infrastructure-level access.

## The three dimensions

### 1. Technical

Anyone with DB credentials or VPS root can read everything. Row-level
encryption only helps against a partially-compromised attacker, not against
the operator.

### 2. Legal (GDPR — relevant since Unwind is EU/Dutch)

The operator becomes a **data controller**. That means:

- A privacy policy is required, telling users what is collected and why.
- Users have the right to request their data (*subject access*) and deletion
  (*right to erasure*).
- Stress levels and behavioral patterns are almost certainly "special
  category" or at minimum *sensitive personal data* — higher bar for consent
  and security.
- A legal basis for processing is required (consent is cleanest for a
  wellness app).
- If the VPS is outside the EU, transfer safeguards are needed.

### 3. Ethical

Users of a neurodivergent wellness app are disclosing vulnerable information.
Having the *ability* to query `SELECT stress_level, chat_message FROM ...`
doesn't mean it should be done casually. Responsible solo-founders impose
self-restraint: read aggregate/anonymous data for debugging, never
individual rows unless a user asks for support and consents.

## Practical measures

- **Separate credentials.** A personal admin account has full access; the
  app's DB user has only what the app needs (no `DROP`, no access to a
  hypothetical `audit_log` the app writes but shouldn't read).
- **Log access.** PostgreSQL can log every connection and query. If a court
  or user ever asks "did you read my data?", the answer is evidence-backed.
- **Encryption at rest.** Disk-level encryption on the VPS so a stolen disk
  doesn't leak everything.
- **Backups are data too.** Every backup is another copy. Encrypt them,
  limit who has the decryption key.
- **Minimize.** The cheapest privacy guarantee is *not collecting the data
  at all*. E.g. do full chat transcripts need to be stored indefinitely, or
  could they auto-delete after 30 days?

## Unwind-specific notes

From `CLAUDE.md`: *"Privacy-sensitive data (stress levels, behavioral
patterns) — handle accordingly."* Concrete things that follow:

- `user_memories.memory_enabled` defaults to `false` — opt-in. Good.
- `api_usage` tracks request counts, not content. Good.
- Chat messages: check what is stored and for how long. If transcripts are
  persisted for conversational context, document that *in the UI*, not just
  in code.
- Onboarding answers feed the system prompt — users should know their
  answers are stored and used this way.

## Insights

- The relevant mental model is **data controller vs data processor** (GDPR
  terms). The operator is the controller: they decide what's collected and
  why. The VPS provider is a processor: they hold data on the operator's
  behalf. Users trust the controller, not the processor — which means the
  responsibility lands on the operator regardless of which VPS is used.
- "Access" has layers: application-level (through the UI), DB-level (psql),
  filesystem-level (reading Postgres data files directly), backup-level
  (restoring a backup elsewhere). A real privacy policy accounts for all
  four. Row encryption only meaningfully blocks DB-level reads; filesystem
  and backup leaks are separate problems.
- The Claude API itself is another data flow. Whatever a user types in chat
  goes to Anthropic. The privacy policy must disclose that, and Anthropic's
  data handling commitments become part of the operator's compliance story.
  Worth reading their data use terms before launch.

## Pre-deployment exercise

Before shipping, write a one-page document listing:

1. Every table
2. What data lives in it
3. How long it's kept
4. Who can access it
5. The legal basis for processing

If any row on that grid feels uncomfortable to defend to a user, that's the
thing to change *before* real users sign up — much easier than retrofitting
later.
