---
name: adr
description: Generate an Architecture Decision Record. Use when a significant technical decision has been made and should be documented.
---

# ADR Generator

## Process

1. Determine the next ADR number by reading `docs/adr/`.
2. If the decision context is not provided, ask: what was the situation, what alternatives were considered, and what was decided.
3. Write to `docs/adr/ADR-{NNN}-{slug}.md`:

```markdown
# ADR-{NNN}: {Title}

## Status: Accepted

## Context
{Situation and alternatives considered.}

## Decision
{What was decided and why.}

## Consequences
{Tradeoffs — what becomes easier, what becomes harder.}
```

## Tone

Concise — a few paragraphs, not an essay. Focus on *why*, not just *what*. Include tradeoffs honestly. Frame decisions as engineering judgment at the project's current scale, not as educational exercises.
