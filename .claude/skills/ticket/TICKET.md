---
name: ticket
description: Turn a feature or bug description into a well-formed GitHub issue and add it to the Unwind (#2) Project board. Use when filing a ticket, standalone or as the first step of /feature.
---

# Ticket

Create a GitHub issue from a feature/bug description and add it to the Project board.

Repo: `nluning/unwind`. Project board: **Unwind (#2)** (`--owner nluning`, project number `2`).

## Process

1. **Scope.** If the description is vague or missing the *why*, ask 1-3 short
   scoping questions first. If it's already clear, skip straight to drafting.
2. **Draft the issue.** Match the language Noor uses to describe it (Dutch
   feature → Dutch ticket). Keep it concise — this is a ~100-user personal
   project, not an enterprise spec. Structure:

   ```markdown
   ## Context
   {Why this matters / the problem being solved. 1-2 sentences.}

   ## Voorstel / Proposal
   {What to build, at a high level.}

   ## Acceptatiecriteria
   - [ ] {Observable, checkable outcomes}

   ## Buiten scope
   {What this ticket explicitly does not cover, if relevant.}
   ```

   Drop sections that don't apply. Don't pad.
3. **Label.** Pick from existing labels: `enhancement` (default for features),
   `bug`, `documentation`, `testing`. Don't invent new labels without asking.
4. **Create and add to the board:**
   ```bash
   url=$(gh issue create --title "<title>" --body "<body>" --label "<label>")
   gh project item-add 2 --owner nluning --url "$url"
   ```
5. **Report back** the issue number and URL. If invoked by `/feature`, return
   these so the flow can continue.

## Notes

- Check existing open issues for duplicates before creating (`gh issue list`).
- If an ADR-governed area is touched, note it in the issue body so the plan
  step remembers to read the relevant ADR.
