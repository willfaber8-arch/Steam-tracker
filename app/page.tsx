import { isDbConfigured } from "@/lib/db";
import { getCurrentStreak, getRecentlyPlayed, getTopGamesThisWeek, getWeeklyTotalMinutes } from "@/lib/db";
import { isSteamConfigured, fetchPlayerSummary } from "@/lib/steam";
import { formatMinutes } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { GameRow } from "@/components/GameRow";
import { SetupNotice } from "@/components/SetupNotice";
import { GrooveBackdrop } from "@/components/VinylMark";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  if (!isSteamConfigured()) {
    return (
      <SetupNotice
        message={
          "STEAM_API_KEY and STEAM_ID64 are not set.\n\n" +
          "1. Generate a key at https://steamcommunity.com/dev/apikey\n" +
          "2. Look up your SteamID64 (e.g. via steamid.io)\n" +
          "3. Add both as environment variables and redeploy."
        }
      />
    );
  }

  if (!isDbConfigured()) {
    return (
      <SetupNotice
        message={
          "POSTGRES_URL is not set.\n\n" +
          "Add a Vercel Postgres (or Supabase) database, copy its connection " +
          "string into your environment variables, then run `npm run db:init` " +
          "to create the schema. The dashboard needs snapshot history before " +
          "it can show weekly totals and streaks — the cron job builds that " +
          "up over time."
        }
      />
    );
  }

  const [weeklyTotal, topGames, recentlyPlayed, streak, playerSummary] = await Promise.all([
    getWeeklyTotalMinutes(),
    getTopGamesThisWeek(5),
    getRecentlyPlayed(6),
    getCurrentStreak(),
    fetchPlayerSummary().catch(() => null),
  ]);

  const inGame = playerSummary?.gameextrainfo;

  return (
    <div className="space-y-8">
      <div>
        <p className="label-tape">Now spinning</p>
        <h1 className="mt-2 font-serif text-3xl text-cassette-cream sm:text-4xl">
          {inGame ? `Currently playing ${inGame}` : "Your week in games"}
        </h1>
        <p className="mt-1 text-sm text-cassette-creamdim">
          Snapshots build up automatically every few hours — trends get richer over time.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="This week" value={formatMinutes(weeklyTotal)} accent />
        <StatCard
          label="Current streak"
          value={`${streak} day${streak === 1 ? "" : "s"}`}
          sublabel={streak > 0 ? "keep it going" : "play something today"}
        />
        <StatCard
          label="Top game this week"
          value={topGames[0]?.name ?? "—"}
          sublabel={topGames[0] ? formatMinutes(topGames[0].minutes_played) : undefined}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="panel relative overflow-hidden p-5">
          <GrooveBackdrop className="-right-24 -top-24 h-64 w-64" />
          <h2 className="relative font-serif text-lg text-cassette-cream">Top games this week</h2>
          <div className="relative mt-3 space-y-1">
            {topGames.length === 0 && (
              <p className="py-6 text-center text-sm text-cassette-creamdim">
                No playtime logged yet this week.
              </p>
            )}
            {topGames.map((g) => (
              <GameRow
                key={g.steam_app_id}
                name={g.name}
                iconUrl={g.icon_url}
                minutes={g.minutes_played}
              />
            ))}
          </div>
        </section>

        <section className="panel relative overflow-hidden p-5">
          <GrooveBackdrop className="-right-24 -top-24 h-64 w-64" />
          <h2 className="relative font-serif text-lg text-cassette-cream">Recently played</h2>
          <div className="relative mt-3 space-y-1">
            {recentlyPlayed.length === 0 && (
              <p className="py-6 text-center text-sm text-cassette-creamdim">
                Nothing played in the last two weeks.
              </p>
            )}
            {recentlyPlayed.map((g) => (
              <GameRow
                key={g.steam_app_id}
                name={g.name}
                iconUrl={g.icon_url}
                minutes={g.minutes_last_2weeks}
                rightLabel={`${formatMinutes(g.minutes_last_2weeks)} / 2wk`}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
