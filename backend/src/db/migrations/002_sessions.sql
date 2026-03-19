CREATE TABLE sessions (
    id              TEXT PRIMARY KEY,
    user_id         UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    expires_at      TIMESTAMPTZ NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT now()
);