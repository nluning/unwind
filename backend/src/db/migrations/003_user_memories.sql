-- Memory storage for AI-learned and user-added facts
-- memory_enabled defaults to false: user must opt in (during onboarding)

ALTER TABLE users ADD COLUMN memory_enabled BOOLEAN DEFAULT false;

CREATE TABLE user_memories (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fact            TEXT NOT NULL,
    source          TEXT NOT NULL CHECK (source IN ('ai_learned', 'user_added', 'onboarding')),
    created_at      TIMESTAMPTZ DEFAULT now(),
    updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_memories_user_id ON user_memories(user_id);
