import {
  isDbConfigured,
  getPlayDates,
  getDailyTotals,
  currentStreakFromDates,
  longestStreakFromDates,
} from "@/lib/db";
import { isoDateDaysAgo, todayIso } from "@/lib/format";
import { StatCard } from "@/components/StatCard";
import { StreakGrid } from "@/components/StreakGrid";
import { SetupNotice } from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

const GRID_DAYS = 70;

export default async function StreaksPage() {
  if (!isDbConfigured()) {
    return <SetupNotice message="POSTGRES_URL is not set. See the dashboard for setup steps." />;
  }

  const startDate = isoDateDaysAgo(GRID_DAYS - 1);
  const endDate = todayIso();

  const [playDates, dailyTotals] = await Promise.all([
    getPlayDates(),
    getDailyTotals(startDate, endDate),
  ]);
  const currentStreak = currentStreakFromDates(playDates);
  const longestStreak = longestStreakFromDates(playDates);

  const byDate = new Map(dailyTotals.map((d) => [d.date, d.minutes_played]));
  const days = Array.from({ length: GRID_DAYS }, (_, i) => {
    const date = isoDateDaysAgo(GRID_DAYS - 1 - i);
    return { date, minutes_played: byDate.get(date) ?? 0 };
  });

  return (
    <div className="space-y-8">
      <div>
        <p className="label-tape">Streaks</p>
        <h1 className="mt-2 font-serif text-3xl text-cassette-cream">Keep the reel spinning</h1>
        <p className="mt-1 text-sm text-cassette-creamdim">
          Consecutive days with any playtime logged.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <StatCard
          label="Current streak"
          value={`${currentStreak} day${currentStreak === 1 ? "" : "s"}`}
          accent
        />
        <StatCard
          label="Longest streak (all-time)"
          value={`${longestStreak} day${longestStreak === 1 ? "" : "s"}`}
        />
      </div>

      <section className="panel p-5">
        <h2 className="font-serif text-lg text-cassette-cream">Last {GRID_DAYS} days</h2>
        <div className="mt-4">
          <StreakGrid days={days} />
        </div>
      </section>
    </div>
  );
}
