import type { SteamOwnedGame, SteamPlayerSummary, SteamRecentGame } from "./types";

const STEAM_API_BASE = "https://api.steampowered.com";

function getApiKey(): string {
  const key = process.env.STEAM_API_KEY;
  if (!key) {
    throw new Error(
      "STEAM_API_KEY is not set. Generate one at https://steamcommunity.com/dev/apikey and add it to your environment variables."
    );
  }
  return key;
}

function getSteamId(): string {
  const id = process.env.STEAM_ID64;
  if (!id) {
    throw new Error(
      "STEAM_ID64 is not set. Look up your 17-digit SteamID64 (e.g. via steamid.io) and add it to your environment variables."
    );
  }
  return id;
}

/**
 * Fetches the full owned-games library for the configured Steam account,
 * including all-time and last-2-weeks playtime per game.
 */
export async function fetchOwnedGames(): Promise<SteamOwnedGame[]> {
  const apiKey = getApiKey();
  const steamId = getSteamId();
  const url = new URL(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamId);
  url.searchParams.set("include_appinfo", "1");
  url.searchParams.set("include_played_free_games", "1");

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Steam GetOwnedGames failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const games: SteamOwnedGame[] = data?.response?.games ?? [];
  return games;
}

/**
 * Fetches games played in the last two weeks.
 */
export async function fetchRecentlyPlayedGames(): Promise<SteamRecentGame[]> {
  const apiKey = getApiKey();
  const steamId = getSteamId();
  const url = new URL(`${STEAM_API_BASE}/IPlayerService/GetRecentlyPlayedGames/v1/`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamid", steamId);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Steam GetRecentlyPlayedGames failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const games: SteamRecentGame[] = data?.response?.games ?? [];
  return games;
}

/**
 * Fetches basic profile status — used for a "currently in-game" indicator.
 */
export async function fetchPlayerSummary(): Promise<SteamPlayerSummary | null> {
  const apiKey = getApiKey();
  const steamId = getSteamId();
  const url = new URL(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`);
  url.searchParams.set("key", apiKey);
  url.searchParams.set("steamids", steamId);

  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Steam GetPlayerSummaries failed: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  const players: SteamPlayerSummary[] = data?.response?.players ?? [];
  return players[0] ?? null;
}

export function gameIconUrl(appid: number, iconHash?: string): string | null {
  if (!iconHash) return null;
  return `https://media.steampowered.com/steamcommunity/public/images/apps/${appid}/${iconHash}.jpg`;
}

/** True when the required Steam credentials are present in the environment. */
export function isSteamConfigured(): boolean {
  return Boolean(process.env.STEAM_API_KEY && process.env.STEAM_ID64);
}
