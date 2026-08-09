/**
 * One-time setup script: creates the games / playtime_snapshots / daily_deltas
 * tables in whatever Postgres database POSTGRES_URL points at.
 *
 * Usage: npm run db:init
 */
import { ensureSchema } from "../lib/db";

async function main() {
  if (!process.env.POSTGRES_URL) {
    console.error(
      "POSTGRES_URL is not set. Add your Vercel Postgres / Supabase connection string to .env.local first."
    );
    process.exit(1);
  }
  console.log("Creating schema (games, playtime_snapshots, daily_deltas)...");
  await ensureSchema();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
