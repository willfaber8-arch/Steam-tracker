import { sql } from "@vercel/postgres";
import type { DailyDelta, Game, TopGame } from "./types";

export function isDbConfigured(): boolean {
  return Boolean(process.env.POSTGRES_URL);
}

const SCHEMA_SQL = `
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

CREATE TABLE IF NOT EXISTS daily_deltas (
  id SERIAL PRIMARY KEY,
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  minutes_played INTEGER NOT NULL DEFAULT 0,
  UNIQUE (game_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_deltas_date ON daily_deltas (date);
`;

/** Creates all tables/indexes if they don't already exist. Safe to call repeatedly. */
export async function ensureSchema(): Promise<void> {
  const statements = SCHEMA_SQL.split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) {
    await sql.query(statement);
  }
}

export async function upsertGame(
  steamAppId: number,
  name: string,
  iconUrl: string | null
): Promise<number> {
  const result = await sql<{ id: number }>`
    INSERT INTO games (steam_app_id, name, icon_url)
    VALUES (${steamAppId}, ${name}, ${iconUrl})
    ON CONFLICT (steam_app_id)
    DO UPDATE SET name = EXCLUDED.name, icon_url = EXCLUDED.icon_url
    RETURNING id
  `;
  return result.rows[0].id;
}

export async function getLatestSnapshot(
  gameId: number
): Promise<{ total_minutes_playtime: number; snapshot_timestamp: string } | null> {
  const result = await sql<{ total_minutes_playtime: number; snapshot_timestamp: string }>`
    SELECT total_minutes_playtime, snapshot_timestamp
    FROM playtime_snapshots
    WHERE game_id = ${gameId}
    ORDER BY snapshot_timestamp DESC
    LIMIT 1
  `;
  return result.rows[0] ?? null;
}

export async function insertSnapshot(
  gameId: number,
  totalMinutes: number,
  minutesLast2Weeks: number
): Promise<{ id: number; snapshot_timestamp: string }> {
  const result = await sql<{ id: number; snapshot_timestamp: string }>`
    INSERT INTO playtime_snapshots (game_id, total_minutes_playtime, minutes_last_2weeks)
    VALUES (${gameId}, ${totalMinutes}, ${minutesLast2Weeks})
    RETURNING id, snapshot_timestamp
  `;
  return result.rows[0];
}

/** Adds `deltaMinutes` to whatever is already recorded for that game on that day. */
export async function accumulateDailyDelta(
  gameId: number,
  date: string,
  deltaMinutes: number
): Promise<void> {
  if (deltaMinutes <= 0) return;
  await sql`
    INSERT INTO daily_deltas (game_id, date, minutes_played)
    VALUES (${gameId}, ${date}, ${deltaMinutes})
    ON CONFLICT (game_id, date)
    DO UPDATE SET minutes_played = daily_deltas.minutes_played + EXCLUDED.minutes_played
  `;
}

export interface SnapshotJobResult {
  gamesProcessed: number;
  gamesFailed: number;
  totalMinutesDeltaToday: number;
  timestamp: string;
}

export async function getWeeklyTotalMinutes(): Promise<number> {
  const result = await sql<{ total: number | null }>`
    SELECT COALESCE(SUM(minutes_played), 0)::int AS total
    FROM daily_deltas
    WHERE date >= (CURRENT_DATE - INTERVAL '6 days')
  `;
  return result.rows[0].total ?? 0;
}

export async function getTopGamesThisWeek(limit = 5): Promise<TopGame[]> {
  const result = await sql<TopGame>`
    SELECT g.steam_app_id, g.name, g.icon_url,
           SUM(d.minutes_played)::int AS minutes_played
    FROM daily_deltas d
    JOIN games g ON g.id = d.game_id
    WHERE d.date >= (CURRENT_DATE - INTERVAL '6 days')
    GROUP BY g.steam_app_id, g.name, g.icon_url
    ORDER BY minutes_played DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

export async function getRecentlyPlayed(limit = 10): Promise<
  Array<{ steam_app_id: number; name: string; icon_url: string | null; minutes_last_2weeks: number }>
> {
  const result = await sql<{
    steam_app_id: number;
    name: string;
    icon_url: string | null;
    minutes_last_2weeks: number;
  }>`
    SELECT steam_app_id, name, icon_url, minutes_last_2weeks
    FROM (
      SELECT DISTINCT ON (g.id)
        g.steam_app_id, g.name, g.icon_url, s.minutes_last_2weeks
      FROM playtime_snapshots s
      JOIN games g ON g.id = s.game_id
      ORDER BY g.id, s.snapshot_timestamp DESC
    ) latest
    WHERE minutes_last_2weeks > 0
    ORDER BY minutes_last_2weeks DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

/** Distinct calendar dates (ascending) that had at least one minute of playtime. */
export async function getPlayDates(): Promise<string[]> {
  const result = await sql<{ date: string }>`
    SELECT date::text AS date
    FROM daily_deltas
    WHERE minutes_played > 0
    GROUP BY date
    ORDER BY date ASC
  `;
  return result.rows.map((r) => r.date);
}

/** Pure computation over an ascending list of played-dates — kept separate from
 * the DB fetch so callers that already have `dates` (e.g. the streaks page,
 * which needs both current and longest streak) don't have to re-query. */
export function currentStreakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0;
  const daySet = new Set(dates);
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  const cursor = new Date(today);
  // Streak is allowed to "start" from today or yesterday (cron may not have
  // run yet today), then must be unbroken going backwards.
  const todayStr = cursor.toISOString().slice(0, 10);
  if (!daySet.has(todayStr)) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let streak = 0;
  while (daySet.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  return streak;
}

/** Pure computation over an ascending list of played-dates — see
 * `currentStreakFromDates` for why this is split out from the DB fetch. */
export function longestStreakFromDates(dates: string[]): number {
  if (dates.length === 0) return 0;
  let longest = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1] + "T00:00:00Z");
    const cur = new Date(dates[i] + "T00:00:00Z");
    const diffDays = Math.round((cur.getTime() - prev.getTime()) / 86400000);
    if (diffDays === 1) {
      current += 1;
    } else {
      current = 1;
    }
    longest = Math.max(longest, current);
  }
  return longest;
}

export async function getCurrentStreak(): Promise<number> {
  const dates = await getPlayDates();
  return currentStreakFromDates(dates);
}

export async function getLongestStreak(): Promise<number> {
  const dates = await getPlayDates();
  return longestStreakFromDates(dates);
}

export async function getDailyTotals(
  startDate: string,
  endDate: string
): Promise<Array<{ date: string; minutes_played: number }>> {
  const result = await sql<{ date: string; minutes_played: number }>`
    SELECT date::text AS date, SUM(minutes_played)::int AS minutes_played
    FROM daily_deltas
    WHERE date >= ${startDate} AND date <= ${endDate}
    GROUP BY date
    ORDER BY date ASC
  `;
  return result.rows;
}

export async function getPerGameTotals(
  startDate: string,
  endDate: string,
  limit = 10
): Promise<TopGame[]> {
  const result = await sql<TopGame>`
    SELECT g.steam_app_id, g.name, g.icon_url,
           SUM(d.minutes_played)::int AS minutes_played
    FROM daily_deltas d
    JOIN games g ON g.id = d.game_id
    WHERE d.date >= ${startDate} AND d.date <= ${endDate}
    GROUP BY g.steam_app_id, g.name, g.icon_url
    ORDER BY minutes_played DESC
    LIMIT ${limit}
  `;
  return result.rows;
}

export async function getRangeTotal(startDate: string, endDate: string): Promise<number> {
  const result = await sql<{ total: number | null }>`
    SELECT COALESCE(SUM(minutes_played), 0)::int AS total
    FROM daily_deltas
    WHERE date >= ${startDate} AND date <= ${endDate}
  `;
  return result.rows[0].total ?? 0;
}

export interface BacklogGame {
  steam_app_id: number;
  name: string;
  icon_url: string | null;
  total_minutes_playtime: number;
  manually_completed: boolean;
  last_played_date: string | null;
  first_seen_date: string;
}

export async function getBacklog(): Promise<BacklogGame[]> {
  const result = await sql<BacklogGame>`
    SELECT
      g.steam_app_id,
      g.name,
      g.icon_url,
      g.manually_completed,
      g.first_seen_date::text AS first_seen_date,
      COALESCE(latest.total_minutes_playtime, 0) AS total_minutes_playtime,
      lastplayed.date::text AS last_played_date
    FROM games g
    LEFT JOIN LATERAL (
      SELECT total_minutes_playtime
      FROM playtime_snapshots s
      WHERE s.game_id = g.id
      ORDER BY s.snapshot_timestamp DESC
      LIMIT 1
    ) latest ON true
    LEFT JOIN LATERAL (
      SELECT date
      FROM daily_deltas d
      WHERE d.game_id = g.id AND d.minutes_played > 0
      ORDER BY d.date DESC
      LIMIT 1
    ) lastplayed ON true
    ORDER BY g.name ASC
  `;
  return result.rows;
}

export async function setGameCompleted(steamAppId: number, completed: boolean): Promise<void> {
  await sql`
    UPDATE games SET manually_completed = ${completed}
    WHERE steam_app_id = ${steamAppId}
  `;
}

export async function getAllGames(): Promise<Game[]> {
  const result = await sql<Game>`
    SELECT steam_app_id, name, icon_url, first_seen_date::text AS first_seen_date, manually_completed
    FROM games
    ORDER BY name ASC
  `;
  return result.rows;
}

export type { DailyDelta };
