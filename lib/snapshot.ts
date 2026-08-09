import { accumulateDailyDelta, ensureSchema, getLatestSnapshot, insertSnapshot, upsertGame } from "./db";
import { fetchOwnedGames, gameIconUrl } from "./steam";
import type { SnapshotJobResult } from "./db";

/**
 * Polls the Steam API for the current library state and records one snapshot
 * per owned game. The delta versus each game's previous snapshot is folded
 * into today's `daily_deltas` row, which is how day-by-day history gets built
 * up over time even though Steam only ever reports cumulative totals.
 */
export async function runSnapshotJob(): Promise<SnapshotJobResult> {
  await ensureSchema();

  const games = await fetchOwnedGames();
  const now = new Date();
  const today = now.toISOString().slice(0, 10);

  let totalMinutesDeltaToday = 0;

  for (const game of games) {
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

  return {
    gamesProcessed: games.length,
    totalMinutesDeltaToday,
    timestamp: now.toISOString(),
  };
}
