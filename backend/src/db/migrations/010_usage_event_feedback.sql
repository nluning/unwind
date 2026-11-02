-- Post-activity feedback: "how did you feel afterwards?"
-- `outcome` is the user's answer on an accepted event. `feedback_dismissed_at`
-- records "Overslaan" so a skipped question is never asked again; it leaves
-- `outcome` NULL, so stats ignore it. `stress_level_after` stays a separate
-- measure and is not reused.

ALTER TABLE usage_events
    ADD COLUMN outcome                TEXT CHECK (outcome IN ('better', 'same', 'worse')),
    ADD COLUMN outcome_at             TIMESTAMPTZ,
    ADD COLUMN feedback_dismissed_at  TIMESTAMPTZ;
