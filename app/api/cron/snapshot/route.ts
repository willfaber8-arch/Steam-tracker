import { NextRequest, NextResponse } from "next/server";
import { runSnapshotJob } from "@/lib/snapshot";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Triggered by Vercel Cron (see vercel.json) every few hours. Vercel signs
 * cron requests with an Authorization: Bearer <CRON_SECRET> header when
 * CRON_SECRET is set, so we verify it to stop this endpoint being polled by
 * anyone who finds the URL.
 */
export async function GET(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  try {
    const result = await runSnapshotJob();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Snapshot job failed:", error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
