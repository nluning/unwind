-- Track API calls per user for rate limiting
-- Counts are checked before each Claude API call

CREATE TABLE api_usage (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    endpoint    TEXT NOT NULL CHECK (endpoint IN ('chat', 'onboarding')),
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_api_usage_user_day ON api_usage(user_id, endpoint, created_at);
