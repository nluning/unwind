-- User-scoped onboarding flag. NULL = not done yet; the router uses this
-- to decide whether to redirect to /onboarding. Set on first successful
-- /onboarding/generate and never overwritten (so refresh runs preserve the
-- original completion timestamp).
--
-- Backfill: anyone with AI-generated activities or onboarding-source
-- memories has already gone through onboarding. Use their created_at so
-- the timestamp reflects when they actually onboarded, not when we ran
-- the migration.

ALTER TABLE users
ADD COLUMN onboarding_completed_at TIMESTAMPTZ;

UPDATE users
SET onboarding_completed_at = users.created_at
WHERE EXISTS (
    SELECT 1 FROM activities
    WHERE activities.user_id = users.id AND activities.source = 'ai'
)
OR EXISTS (
    SELECT 1 FROM user_memories
    WHERE user_memories.user_id = users.id
      AND user_memories.source = 'onboarding'
);
