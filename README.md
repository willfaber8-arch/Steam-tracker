# Steam Tracker

A standalone, single-user dashboard for tracking Steam gaming activity over
time — playtime trends, library backlog, and daily streaks. Built with a
warm vinyl/cassette aesthetic (amber/orange palette, analog textures, warm
mono/serif type) as a deliberate contrast to typical "AI app" purple
gradients and glassmorphism.

The Steam Web API only ever reports *current cumulative* playtime, not a
day-by-day log. This app polls it on a schedule and stores snapshots in
Postgres, then computes day-by-day deltas from consecutive snapshots — that
accumulated history is what powers the trend charts and streak tracking.

## Stack

- **Frontend/backend:** Next.js 14 (App Router), Vercel Serverless Functions
- **Database:** Vercel Postgres (`@vercel/postgres`) — Supabase's Postgres
  works too, since it's just a connection string
- **Scheduled jobs:** Vercel Cron (`vercel.json`), polling every 5 hours
- **Charts:** Recharts
- **Styling:** Tailwind CSS, IBM Plex Mono + Lora

## Prerequisites

- [ ] A Steam Web API key — generate one at
      https://steamcommunity.com/dev/apikey
- [ ] Your SteamID64 (17-digit) — look it up at https://steamid.io or
      similar
- [ ] A Postgres database — either
      [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres) or
      [Supabase](https://supabase.com/)
- [ ] Your Steam profile privacy set to Public (or at minimum "game
      details" visible), or `GetOwnedGames` will return an empty library

## Local setup

```bash
npm install
cp .env.example .env.local
# fill in STEAM_API_KEY, STEAM_ID64, POSTGRES_URL in .env.local

npm run db:init   # creates the games / playtime_snapshots / daily_deltas tables
npm run dev
```

Open http://localhost:3000. Until at least one cron/snapshot run has
happened, the dashboard/trends/streaks views will show empty states — the
first snapshot establishes a baseline, and the *next* one is what produces
the first day-by-day delta.

To trigger a snapshot manually during local dev:

```bash
curl http://localhost:3000/api/cron/snapshot
```

## Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Add a Postgres database from the Vercel Storage tab (or connect an
   existing Supabase project) and link it to the project — this populates
   `POSTGRES_URL` automatically.
3. Add `STEAM_API_KEY` and `STEAM_ID64` as project environment variables.
4. Optionally add a `CRON_SECRET` env var — Vercel Cron automatically sends
   it as a Bearer token, and `/api/cron/snapshot` verifies it so the
   endpoint can't be triggered by anyone who finds the URL.
5. Deploy, then run `npm run db:init` once against the production
   `POSTGRES_URL` (or hit `/api/cron/snapshot` once manually — it calls
   `ensureSchema()` itself before doing anything else, so this step is
   actually optional).
6. Vercel Cron (configured in `vercel.json`) will hit
   `/api/cron/snapshot` every 5 hours from then on.

## Data model

- **`games`** — `steam_app_id`, `name`, `icon_url`, `first_seen_date`,
  `manually_completed` (the last one is a manual backlog flag, since Steam
  has no native "completed" state beyond achievements)
- **`playtime_snapshots`** — one row per game per poll: `game_id`,
  `snapshot_timestamp`, `total_minutes_playtime`, `minutes_last_2weeks`
- **`daily_deltas`** — `game_id`, `date`, `minutes_played`, built
  incrementally by the cron job as `(this snapshot's total) - (previous
  snapshot's total)`, attributed to the day the snapshot ran on. This is
  what trends/streaks/weekly-totals actually query — it's cheap to read
  and doesn't require re-deriving deltas from raw snapshots on every page
  load.

See `lib/schema.sql` for the full DDL.

## Views

- **Dashboard** (`/`) — this week's total playtime, current streak, top
  game this week, top games this week, recently played
- **Trends** (`/trends`) — daily playtime chart over a selectable range
  (7/30/90 days), per-game breakdown for that range, this-month-vs-last-month
  comparison
- **Backlog** (`/backlog`) — full library, sortable by playtime / last
  played / alphabetical, filterable by unplayed / played / completed, with
  a manual "mark done" toggle
- **Streaks** (`/streaks`) — current streak, longest streak (all-time), and
  a 70-day activity grid

## Project structure

```
app/
  page.tsx                 dashboard
  trends/page.tsx
  backlog/page.tsx
  streaks/page.tsx
  api/cron/snapshot/route.ts   polled by Vercel Cron
  api/backlog/complete/route.ts
components/                UI building blocks (design-system pieces live here)
lib/
  steam.ts                 Steam Web API client
  db.ts                    Postgres queries
  snapshot.ts               the polling job itself
  schema.sql
scripts/init-db.ts         one-time schema setup
vercel.json                cron schedule
```

## Out of scope (for this build)

- Music tracking, multi-user support/auth, other platform integrations
  (Xbox/PlayStation/Riot/Epic), and Zenith integration are all explicitly
  out of scope — this app is Steam-only and single-user by design.
