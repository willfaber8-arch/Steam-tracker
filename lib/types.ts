export interface SteamOwnedGame {
  appid: number;
  name: string;
  playtime_forever: number; // minutes, all-time
  playtime_2weeks?: number; // minutes, last 2 weeks
  img_icon_url?: string;
  rtime_last_played?: number; // unix timestamp
}

export interface SteamRecentGame {
  appid: number;
  name: string;
  playtime_2weeks: number;
  playtime_forever: number;
  img_icon_url?: string;
}

export interface SteamPlayerSummary {
  steamid: string;
  personaname: string;
  avatarfull: string;
  personastate: number; // 0 offline, 1 online, ...
  gameid?: string;
  gameextrainfo?: string; // name of game currently being played
}

export interface Game {
  steam_app_id: number;
  name: string;
  icon_url: string | null;
  first_seen_date: string;
  manually_completed: boolean;
}

export interface PlaytimeSnapshot {
  id: number;
  game_id: number;
  snapshot_timestamp: string;
  total_minutes_playtime: number;
  minutes_last_2weeks: number;
}

export interface DailyDelta {
  game_id: number;
  day: string; // ISO date
  minutes_played: number;
}

export interface TopGame {
  steam_app_id: number;
  name: string;
  icon_url: string | null;
  minutes_played: number;
}
