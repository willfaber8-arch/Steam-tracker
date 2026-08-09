import { formatDateLabel, formatMinutes } from "@/lib/format";

interface Day {
  date: string;
  minutes_played: number;
}

function intensityClass(minutes: number, max: number): string {
  if (minutes <= 0) return "bg-cassette-surface2";
  const ratio = minutes / max;
  if (ratio > 0.75) return "bg-cassette-amber";
  if (ratio > 0.45) return "bg-cassette-amber/70";
  if (ratio > 0.15) return "bg-cassette-amberdim/60";
  return "bg-cassette-amberdim/30";
}

export function StreakGrid({ days }: { days: Day[] }) {
  const max = Math.max(1, ...days.map((d) => d.minutes_played));

  return (
    <div className="grid grid-cols-7 gap-1.5 sm:grid-cols-10">
      {days.map((d) => (
        <div
          key={d.date}
          title={`${formatDateLabel(d.date)}: ${formatMinutes(d.minutes_played)}`}
          className={`aspect-square rounded-sm border border-cassette-groove/60 ${intensityClass(
            d.minutes_played,
            max
          )}`}
        />
      ))}
    </div>
  );
}
