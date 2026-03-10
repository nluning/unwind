CREATE TABLE users (
    id uuid DEFAULT gen_random_uuid(),
    email TEXT UNIQUE,
    password_hash TEXT,
    device_id TEXT UNIQUE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name TEXT UNIQUE NOT NULL
);

CREATE TABLE activities (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    suggested_duration INT NOT NULL,
    min_stress_level INT NOT NULL CHECK (min_stress_level >= 1 AND min_stress_level <= 5),
    max_stress_level INT NOT NULL CHECK (max_stress_level >= min_stress_level AND max_stress_level <= 5),
    source TEXT NOT NULL CHECK (source IN ('base', 'user', 'ai')),
    times_suggested INTEGER DEFAULT 0,
    times_accepted  INTEGER DEFAULT 0,
    times_skipped   INTEGER DEFAULT 0,
    is_hidden       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (id)
);

CREATE TABLE activity_categories (
    activity_id uuid REFERENCES activities(id) ON DELETE CASCADE,
    category_id     INTEGER REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (activity_id, category_id)
);

CREATE TABLE usage_events (
    id uuid DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    activity_id uuid REFERENCES activities(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('suggested', 'accepted', 'skipped')),
    mode TEXT NOT NULL CHECK (mode IN ('mode1', 'mode2', 'mode3', 'mode4')),
    stress_level_before   INTEGER CHECK (stress_level_before >= 1 AND stress_level_before <= 5),
    stress_level_after    INTEGER CHECK (stress_level_after >= 1 AND stress_level_after <= 5),
    created_at      TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (id)
);