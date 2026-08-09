import Link from "next/link";
import { isDbConfigured, getBacklog } from "@/lib/db";
import { BacklogTable } from "@/components/BacklogTable";
import { SetupNotice } from "@/components/SetupNotice";

export const dynamic = "force-dynamic";

const SORTS = [
  { key: "playtime", label: "Playtime" },
  { key: "recent", label: "Last played" },
  { key: "alpha", label: "A–Z" },
];

const FILTERS = [
  { key: "all", label: "All" },
  { key: "unplayed", label: "Unplayed" },
  { key: "played", label: "Played" },
  { key: "completed", label: "Completed" },
];

export default async function BacklogPage({
  searchParams,
}: {
  searchParams: { sort?: string; filter?: string };
}) {
  if (!isDbConfigured()) {
    return <SetupNotice message="POSTGRES_URL is not set. See the dashboard for setup steps." />;
  }

  const sort = SORTS.find((s) => s.key === searchParams.sort)?.key ?? "playtime";
  const filter = FILTERS.find((f) => f.key === searchParams.filter)?.key ?? "all";

  let games = await getBacklog();

  if (filter === "unplayed") games = games.filter((g) => g.total_minutes_playtime === 0);
  else if (filter === "played")
    games = games.filter((g) => g.total_minutes_playtime > 0 && !g.manually_completed);
  else if (filter === "completed") games = games.filter((g) => g.manually_completed);

  if (sort === "playtime") {
    games = [...games].sort((a, b) => b.total_minutes_playtime - a.total_minutes_playtime);
  } else if (sort === "recent") {
    games = [...games].sort((a, b) => (b.last_played_date ?? "").localeCompare(a.last_played_date ?? ""));
  } else {
    games = [...games].sort((a, b) => a.name.localeCompare(b.name));
  }

  const total = games.length;

  return (
    <div className="space-y-6">
      <div>
        <p className="label-tape">Backlog</p>
        <h1 className="mt-2 font-serif text-3xl text-cassette-cream">Library</h1>
        <p className="mt-1 text-sm text-cassette-creamdim">{total} games</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-1 rounded-full border border-cassette-groove bg-cassette-surface p-1">
          {FILTERS.map((f) => (
            <Link
              key={f.key}
              href={`/backlog?sort=${sort}&filter=${f.key}`}
              className={`rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                f.key === filter
                  ? "bg-cassette-amber text-cassette-bg"
                  : "text-cassette-creamdim hover:text-cassette-amber"
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-1 rounded-full border border-cassette-groove bg-cassette-surface p-1">
          {SORTS.map((s) => (
            <Link
              key={s.key}
              href={`/backlog?sort=${s.key}&filter=${filter}`}
              className={`rounded-full px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors ${
                s.key === sort
                  ? "bg-cassette-amber text-cassette-bg"
                  : "text-cassette-creamdim hover:text-cassette-amber"
              }`}
            >
              Sort: {s.label}
            </Link>
          ))}
        </div>
      </div>

      {games.length === 0 ? (
        <p className="panel p-8 text-center text-sm text-cassette-creamdim">No games match this filter.</p>
      ) : (
        <BacklogTable games={games} />
      )}
    </div>
  );
}
