-- V1: Create initial schema for the Deadline Manager.
-- All timestamps use timestamptz (timezone-aware) so UTC is stored correctly.
-- Flyway manages all schema changes; Hibernate is set to ddl-auto=validate only.

-- ============================================================
-- Table: deadlines
-- Stores all deadlines (both active and completed).
-- ============================================================
CREATE TABLE deadlines (
    -- Auto-incrementing primary key.
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,

    -- Required title: 1–150 characters (enforced by API; stored verbatim).
    title        TEXT NOT NULL,

    -- Optional short description: up to 200 characters.
    short_description TEXT,

    -- Optional long description: shown only in detail dialog, up to 5000 chars.
    long_description  TEXT,

    -- The user-set due date/time, stored in UTC.
    due_at       TIMESTAMPTZ NOT NULL,

    -- Whether the deadline has been completed (moved to history).
    -- Overdue != completed; this flag is set only by the user clicking complete.
    completed    BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit timestamps.
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Set when the user marks the deadline as completed; NULL when active.
    -- The CHECK constraint enforces that completed and completed_at are always in sync.
    completed_at TIMESTAMPTZ,

    -- Logical invariant: a deadline is completed if and only if completed_at is set.
    CONSTRAINT chk_completed_sync
        CHECK ((completed = TRUE AND completed_at IS NOT NULL)
            OR (completed = FALSE AND completed_at IS NULL))
);

-- Index for the active deadline list (sorted by due date ascending).
CREATE INDEX idx_deadlines_active_due
    ON deadlines (completed, due_at ASC)
    WHERE completed = FALSE;

-- Index for the completed deadline list (sorted by completion date descending).
CREATE INDEX idx_deadlines_completed_at
    ON deadlines (completed, completed_at DESC)
    WHERE completed = TRUE;

-- ============================================================
-- Table: app_settings
-- Single-row settings table (id must always be 1).
-- ============================================================
CREATE TABLE app_settings (
    -- Only one row allowed; id = 1 is the singleton key.
    id                   SMALLINT PRIMARY KEY CHECK (id = 1),

    -- Number of total hours remaining at which a deadline turns red.
    -- Must be a positive integer less than yellow_threshold_hours.
    red_threshold_hours  INTEGER NOT NULL,

    -- Number of total hours remaining at which a deadline turns yellow.
    -- Must be greater than red_threshold_hours and at most 8760 (one year).
    yellow_threshold_hours INTEGER NOT NULL,

    -- Audit timestamp.
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Urgency rule: red threshold must be a positive integer, strictly less than yellow.
    CONSTRAINT chk_threshold_order
        CHECK (red_threshold_hours > 0
            AND yellow_threshold_hours > red_threshold_hours)
);

-- Insert the default settings (24h red, 72h yellow).
-- ON CONFLICT is a safety net; the PRIMARY KEY prevents duplicates.
INSERT INTO app_settings (id, red_threshold_hours, yellow_threshold_hours)
VALUES (1, 24, 72)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SUPABASE EXPOSURE FIX
-- Enable Row Level Security on both tables with NO policies.
-- With RLS enabled and no policies, Supabase's Data API (PostgREST)
-- cannot read or write these tables — only the backend JDBC user can.
-- Also revoke all privileges from the anon/authenticated roles that
-- Supabase auto-creates, using a DO block so this migration also works
-- on plain Postgres (where those roles may not exist).
-- ============================================================

ALTER TABLE deadlines    ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    -- Revoke from 'anon' role if it exists (Supabase creates this role).
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
        REVOKE ALL PRIVILEGES ON TABLE deadlines    FROM anon;
        REVOKE ALL PRIVILEGES ON TABLE app_settings FROM anon;
    END IF;

    -- Revoke from 'authenticated' role if it exists (Supabase creates this role).
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        REVOKE ALL PRIVILEGES ON TABLE deadlines    FROM authenticated;
        REVOKE ALL PRIVILEGES ON TABLE app_settings FROM authenticated;
    END IF;
END;
$$;
