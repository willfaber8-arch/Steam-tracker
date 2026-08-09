import { NextRequest, NextResponse } from "next/server";
import { setGameCompleted } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Toggles the manual "completed" flag for a game in the backlog. Steam has no
 * native completion flag, so this is a manual marker the user sets themselves.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const steamAppId = Number(body?.steamAppId);
  const completed = Boolean(body?.completed);

  if (!steamAppId || Number.isNaN(steamAppId)) {
    return NextResponse.json({ error: "steamAppId is required" }, { status: 400 });
  }

  try {
    await setGameCompleted(steamAppId, completed);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to update completion status:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
