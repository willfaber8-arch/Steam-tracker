-- Steam Game Tracker schema
-- Run once against your Vercel Postgres / Supabase database (see scripts/init-db.ts,
-- or `npm run db:init`). All statements are idempotent.

CREATE TABLE IF NOT EXISTS games (
  id SERIAL PRIMARY KEY,
  steam_app_id INTEGER UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon_url TEXT,
  first_seen_date DATE NOT NULL DEFAULT CURRENT_DATE,
  manually_completed BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS playtime_snapshots (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  snapshot_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_minutes_playtime INTEGER NOT NULL DEFAULT 0,
  minutes_last_2weeks INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_snapshots_game_time
  ON playtime_snapshots (game_id, snapshot_timestamp DESC);

-- Materialized day-by-day playtime, built incrementally by the cron job as the
-- delta between consecutive snapshots for a game. This is what powers trends
-- and streaks, since the Steam API itself only exposes current cumulative totals.
CREATE TABLE IF NOT EXISTS daily_deltas (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes_played INTEGER NOT NULL DEFAULT 0,
  UNIQUE (game_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_deltas_date ON daily_deltas (date);
