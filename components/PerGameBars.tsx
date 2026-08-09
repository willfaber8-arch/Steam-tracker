import { formatMinutes } from "@/lib/format";
import type { TopGame } from "@/lib/types";

/** Simple horizontal bar breakdown — kept as plain divs rather than another
 * chart-library instance since it's just a ranked list with a magnitude cue. */
export function PerGameBars({ games }: { games: TopGame[] }) {
  const max = Math.max(1, ...games.map((g) => g.minutes_played));

  if (games.length === 0) {
    return <p className="py-6 text-center text-sm text-cassette-creamdim">No playtime in this range.</p>;
  }

  return (
    <div className="space-y-3">
      {games.map((g) => (
        <div key={g.steam_app_id}>
          <div className="mb-1 flex items-center justify-between text-sm">
            <span className="truncate text-cassette-cream">{g.name}</span>
            <span className="ml-2 shrink-0 font-mono text-xs text-cassette-amber">
              {formatMinutes(g.minutes_played)}
            </span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-cassette-surface2">
            <div
              className="h-full rounded-full bg-gradient-to-r from-cassette-amberdim to-cassette-amber"
              style={{ width: `${Math.max(4, (g.minutes_played / max) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
