export type TournamentBracketFormat = 'single-elimination' | 'double-elimination'

export type BracketSectionKind = 'winners' | 'losers' | 'grand-final'

export type BracketMatchStatus =
  | 'upcoming'
  | 'live'
  | 'finished'
  | 'cancelled'
  | 'pending'
  | 'bye'

export type MatchSeriesFormat = 'BO1' | 'BO3' | 'BO5'

export interface BracketParticipant {
  id?: string
  name: string
  logo?: string | null
  score?: number | null
  isWinner?: boolean
  isTBD?: boolean
  isBye?: boolean
}

export interface BracketMatchData {
  id: string
  round: number
  position: number
  section?: BracketSectionKind
  status: BracketMatchStatus
  matchFormat?: MatchSeriesFormat
  startTime?: string | null
  winnerName?: string | null
  participants: [BracketParticipant, BracketParticipant]
  raw?: unknown
}

export interface BracketRoundData {
  id: string
  title: string
  round: number
  matches: BracketMatchData[]
}

export interface BracketSectionData {
  id: string
  title: string
  kind?: BracketSectionKind
  rounds: BracketRoundData[]
}

export interface TournamentBracketData {
  id: string
  title?: string
  format: TournamentBracketFormat
  sections: BracketSectionData[]
}
