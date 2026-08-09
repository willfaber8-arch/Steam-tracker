import Image from "next/image";
import { formatMinutes } from "@/lib/format";

export function GameRow({
  name,
  iconUrl,
  minutes,
  rightLabel,
}: {
  name: string;
  iconUrl: string | null;
  minutes: number;
  rightLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-cassette-surface2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-md border border-cassette-groove bg-cassette-surface2">
        {iconUrl ? (
          <Image src={iconUrl} alt="" width={36} height={36} className="h-full w-full object-cover" />
        ) : (
          <span className="font-mono text-xs text-cassette-amberdim">?</span>
        )}
      </div>
      <span className="min-w-0 flex-1 truncate text-sm text-cassette-cream">{name}</span>
      <span className="shrink-0 font-mono text-xs text-cassette-amber">
        {rightLabel ?? formatMinutes(minutes)}
      </span>
    </div>
  );
}
