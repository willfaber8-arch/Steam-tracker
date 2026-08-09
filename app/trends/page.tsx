import Link from "next/link";
import { isDbConfigured, getDailyTotals, getPerGameTotals, getRangeTotal } from "@/lib/db";
import { isoDateDaysAgo, todayIso, formatMinutes } from "@/lib/format";
import { TrendChart } from "@/components/TrendChart";
import { PerGameBars } from "@/components/PerGameBars";
import { StatCard } from "@/components/StatCard";
import { SetupNotice } from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

const RANGES = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
];

export default async function TrendsPage({
  searchParams,
}: {
  searchParams: { range?: string };
}) {
  if (!isDbConfigured()) {
    return <SetupNotice message="POSTGRES_URL is not set. See the dashboard for setup steps." />;
  }

  const activeRange = RANGES.find((r) => r.key === searchParams.range) ?? RANGES[1];
  const startDate = isoDateDaysAgo(activeRange.days - 1);
  const endDate = todayIso();

  // Month-over-month comparison
  const now = new Date();
  const thisMonthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
  const lastMonthDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 1, 1));
  const lastMonthStart = lastMonthDate.toISOString().slice(0, 10);
  const lastMonthEnd = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 0))
    .toISOString()
    .slice(0, 10);

  const [dailyTotals, perGame, thisMonthTotal, lastMonthTotal] = await Promise.all([
    getDailyTotals(startDate, endDate),
    getPerGameTotals(startDate, endDate, 8),
    getRangeTotal(thisMonthStart, endDate),
    getRangeTotal(lastMonthStart, lastMonthEnd),
  ]);

  // Fill in zero-days so the chart doesn't have gaps
  const filled: Array<{ date: string; minutes_played: number }> = [];
  const byDate = new Map(dailyTotals.map((d) => [d.date, d.minutes_played]));
  for (let i = 0; i < activeRange.days; i++) {
    const date = isoDateDaysAgo(activeRange.days - 1 - i);
    filled.push({ date, minutes_played: byDate.get(date) ?? 0 });
  }

  const diff = thisMonthTotal - lastMonthTotal;
  const diffLabel =
    lastMonthTotal === 0
      ? "no data last month"
      : `${diff >= 0 ? "+" : ""}${formatMinutes(Math.abs(diff))} ${diff >= 0 ? "more" : "less"} than last month`;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="label-tape">Trends</p>
          <h1 className="mt-2 font-serif text-3xl text-cassette-cream">Playtime over time</h1>
        </div>
        <div className="flex gap-1 rounded-full border border-cassette-groove bg-cassette-surface p-1">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={`/trends?range=${r.key}`}
              className={`rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                r.key === activeRange.key
                  ? "bg-cassette-amber text-cassette-bg"
                  : "text-cassette-creamdim hover:text-cassette-amber"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </div>
      </div>

      <section className="panel p-5">
        <h2 className="font-serif text-lg text-cassette-cream">Daily playtime</h2>
        <div className="mt-4">
          <TrendChart data={filled} />
        </div>
      </section>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <section className="panel p-5">
          <h2 className="font-serif text-lg text-cassette-cream">Per-game breakdown</h2>
          <p className="mt-1 text-xs text-cassette-creamdim">
            {activeRange.label} · {startDate} to {endDate}
          </p>
          <div className="mt-4">
            <PerGameBars games={perGame} />
          </div>
        </section>

        <section className="space-y-4">
          <h2 className="font-serif text-lg text-cassette-cream">This month vs. last month</h2>
          <div className="grid grid-cols-2 gap-4">
            <StatCard label="This month" value={formatMinutes(thisMonthTotal)} accent />
            <StatCard label="Last month" value={formatMinutes(lastMonthTotal)} />
          </div>
          <p className="px-1 text-sm text-cassette-creamdim">{diffLabel}</p>
        </section>
      </div>
    </div>
  );
}
