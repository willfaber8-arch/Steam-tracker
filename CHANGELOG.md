# Changelog

## 0.1.0 — Initial build

Full implementation of the Steam Game Tracker spec.

- **Phase 1 — Core integration:** Steam Web API client (`GetOwnedGames`,
  `GetRecentlyPlayedGames`, `GetPlayerSummaries`) and a live dashboard.
- **Phase 2 — Persistence:** Vercel Postgres schema (`games`,
  `playtime_snapshots`, `daily_deltas`) plus a cron-triggered snapshot job
  that computes day-by-day deltas from consecutive snapshots, since the
  Steam API only ever exposes cumulative totals.
- **Phase 3 — Trends & visualization:** Recharts area chart over
  selectable ranges (7/30/90 days), per-game breakdown, this-month-vs-
  last-month comparison.
- **Phase 4 — Backlog & streaks:** Full library view with sort/filter and
  a manual "completed" flag, current/longest streak tracking with a
  70-day activity grid.
- **Phase 5 — Design pass:** Amber/charcoal vinyl-cassette palette, grain
  texture, IBM Plex Mono + Lora, vinyl-groove accents, responsive layout
  across all views.

See `README.md` for setup and deploy instructions.
