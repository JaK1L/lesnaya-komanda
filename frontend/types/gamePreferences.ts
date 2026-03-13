/**
 * TypeScript interfaces for game preferences feature
 */

export interface GamePreference {
  game: string
  custom_name: string | null
}

export interface GamePreferencesResponse {
  status: string
  message: string
}

export interface UserData {
  discord_id: number
  discord_username: string
  game_preferences: GamePreference[] | null
  forest_rank: string
  rating: number
  avatar_url: string | null
  site_nickname: string | null
  bio: string | null
  is_hidden: boolean
  is_admin: boolean
}

export interface GameStatistics {
  CS2: number
  "DOTA 2": number
  VALORANT: number
  ДРУГИЕ: number
}

// Steam CDN covers for known games
export const GAME_COVERS: Record<string, string> = {
  "CS2":          "https://cdn.cloudflare.steamstatic.com/steam/apps/730/header.jpg",
  "DOTA 2":       "https://cdn.cloudflare.steamstatic.com/steam/apps/570/header.jpg",
  "PUBG":         "https://cdn.cloudflare.steamstatic.com/steam/apps/578080/header.jpg",
  "Apex Legends": "https://cdn.cloudflare.steamstatic.com/steam/apps/1172470/header.jpg",
  "GTA V":        "https://cdn.cloudflare.steamstatic.com/steam/apps/271590/header.jpg",
}

// Fallback accent colors for games without a cover
export const GAME_COLORS: Record<string, string> = {
  "VALORANT":          "#ff4655",
  "League of Legends": "#c89b3c",
  "Overwatch 2":       "#f99e1a",
  "Fortnite":          "#00d4ff",
  "Minecraft":         "#5d9e31",
  "Другое":            "#6b7280",
}

// Valid game names
export const VALID_GAMES = [
  "CS2",
  "DOTA 2",
  "VALORANT",
  "PUBG",
  "Apex Legends",
  "League of Legends",
  "Overwatch 2",
  "Fortnite",
  "Minecraft",
  "GTA V",
  "Другое"
] as const

export type ValidGame = typeof VALID_GAMES[number]
