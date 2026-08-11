import { accumulateDailyDelta, ensureSchema, getLatestSnapshot, insertSnapshot, upsertGame } from "./db";
import { fetchOwnedGames, gameIconUrl } from "./steam";
import type { SnapshotJobResult } from "./db";

// How many games to process concurrently. The Hobby-plan cron only fires
// once a day (see vercel.json), so a single transient failure or a run that
// blows past `maxDuration` costs a full day of history — processing games in
// small concurrent batches keeps wall-clock time down, and isolating errors
// per game (below) means one bad game can't sink the whole run.
const CONCURRENCY = 8;

/**
 * Polls the Steam API for the current library state and records one snapshot
 * per owned game. The delta versus each game's previous snapshot is folded
 * into today's `daily_deltas` row, which is how day-by-day history gets built
 * up over time even though Steam only ever reports cumulative totals.
 *
 * Each game is processed independently: if one game's DB write fails, the
 * rest still get recorded rather than the whole run aborting.
 */
export async function runSnapshotJob(): Promise<SnapshotJobResult> {
  await ensureSchema();

  const games = await fetchOwnedGames();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  let totalMinutesDeltaToday = 0;
  let gamesFailed = 0;

  async function processGame(game: (typeof games)[number]): Promise<void> {
    const iconUrl = gameIconUrl(game.appid, game.img_icon_url);
    const gameId = await upsertGame(game.appid, game.name, iconUrl);

    const previous = await getLatestSnapshot(gameId);
    const totalMinutes = game.playtime_forever ?? 0;
    const minutes2weeks = game.playtime_2weeks ?? 0;

    await insertSnapshot(gameId, totalMinutes, minutes2weeks);

    if (previous) {
      const delta = totalMinutes - previous.total_minutes_playtime;
      if (delta > 0) {
        await accumulateDailyDelta(gameId, today, delta);
        totalMinutesDeltaToday += delta;
      }
    }
    // No previous snapshot yet: this is the first time we've seen the game,
    // so there's no delta to attribute (we only know the cumulative total,
    // not when that playtime happened).
  }

  for (let i = 0; i < games.length; i += CONCURRENCY) {
    const batch = games.slice(i, i + CONCURRENCY);
    const results = await Promise.allSettled(batch.map(processGame));
    for (const [j, result] of results.entries()) {
      if (result.status === "rejected") {
        gamesFailed += 1;
        console.error(`Snapshot failed for appid ${batch[j].appid}:`, result.reason);
      }
    }
  }

  return {
    gamesProcessed: games.length - gamesFailed,
    gamesFailed,
    totalMinutesDeltaToday,
    timestamp: now.toISOString(),
  };
}
