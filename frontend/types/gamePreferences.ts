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
