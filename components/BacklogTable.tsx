"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { formatMinutes } from "@/lib/format";
import type { BacklogGame } from "@/lib/db";

export function BacklogTable({ games }: { games: BacklogGame[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState<number | null>(null);

  async function toggleCompleted(steamAppId: number, completed: boolean) {
    setBusyId(steamAppId);
    try {
      await fetch("/api/backlog/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ steamAppId, completed }),
      });
      startTransition(() => router.refresh());
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="panel overflow-x-auto">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-cassette-groove text-xs uppercase tracking-wider text-cassette-creamdim">
            <th className="px-4 py-3 font-normal">Game</th>
            <th className="px-4 py-3 font-normal">Status</th>
            <th className="px-4 py-3 font-normal">Playtime</th>
            <th className="px-4 py-3 font-normal">Last played</th>
            <th className="px-4 py-3 font-normal text-right">Completed</th>
          </tr>
        </thead>
        <tbody>
          {games.map((g) => {
            const status = g.manually_completed
              ? "Completed"
              : g.total_minutes_playtime > 0
                ? "Played"
                : "Unplayed";
            return (
              <tr
                key={g.steam_app_id}
                className="border-b border-cassette-groove/60 last:border-0 hover:bg-cassette-surface2"
              >
                <td className="px-4 py-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-md border border-cassette-groove bg-cassette-surface2">
                      {g.icon_url ? (
                        <Image src={g.icon_url} alt="" width={32} height={32} className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-mono text-[10px] text-cassette-amberdim">?</span>
                      )}
                    </div>
                    <span className="truncate text-cassette-cream">{g.name}</span>
                  </div>
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={`label-tape ${
                      status === "Completed"
                        ? "text-cassette-amber"
                        : status === "Played"
                          ? "text-cassette-creamdim"
                          : "text-cassette-tape"
                    }`}
                  >
                    {status}
                  </span>
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-cassette-cream">
                  {formatMinutes(g.total_minutes_playtime)}
                </td>
                <td className="px-4 py-2.5 font-mono text-xs text-cassette-creamdim">
                  {g.last_played_date ?? "—"}
                </td>
                <td className="px-4 py-2.5 text-right">
                  <button
                    onClick={() => toggleCompleted(g.steam_app_id, !g.manually_completed)}
                    disabled={busyId === g.steam_app_id || pending}
                    className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-wider transition-colors disabled:opacity-50 ${
                      g.manually_completed
                        ? "border-cassette-amber bg-cassette-amber/10 text-cassette-amber"
                        : "border-cassette-groove text-cassette-creamdim hover:border-cassette-amberdim hover:text-cassette-amber"
                    }`}
                  >
                    {g.manually_completed ? "Undo" : "Mark done"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
