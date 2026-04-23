-- Per-user hide for shared (base) activities.
-- Base rows have user_id IS NULL and are visible to everyone, so we cannot
-- mutate the row itself. A (user_id, activity_id) join row means "hidden
-- for this user." User-owned rows are hard-deleted instead and never appear here.

CREATE TABLE user_hidden_activities (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
    hidden_at   TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, activity_id)
);

CREATE INDEX idx_user_hidden_activities_user_id ON user_hidden_activities(user_id);
