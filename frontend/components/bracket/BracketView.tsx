'use client'

import TournamentBracket from '../tournament/TournamentBracket'
import type { BracketSectionData } from '../tournament/types'

export interface BracketMatch {
  id: number
  tournament_id?: number
  bracket_type?: string
  section: string
  round: number
  match_index: number
  player1_name: string | null
  player2_name: string | null
  winner_name: string | null
  score1: number | null
  score2: number | null
  is_bye: boolean
  status: string
  match_format?: 'BO1' | 'BO3' | 'BO5' | null
  start_time?: string | null
  next_winner_match_id?: number | null
  next_loser_match_id?: number | null
}

interface Props {
  matches: BracketMatch[]
  section?: string
  onSelectWinner?: (match: BracketMatch, winner: string) => void
  onDropPlayer?: (match: BracketMatch, slot: 1 | 2, player: string) => void
  adminMode?: boolean
}

function getRoundTitle(round: number, totalRounds: number) {
  if (round === totalRounds) return totalRounds > 1 ? 'Финал' : 'Матч'
  if (round === totalRounds - 1 && totalRounds > 2) return 'Полуфинал'
  return `Раунд ${round}`
}

function normalizeStatus(match: BracketMatch) {
  if (match.is_bye) return 'bye'
  if (match.status === 'completed') return 'finished'
  if (match.status === 'cancelled') return 'cancelled'
  if (match.status === 'live') return 'live'
  if (match.status === 'pending') return 'pending'
  if (match.status === 'upcoming') return 'upcoming'
  if (!match.player1_name || !match.player2_name) return 'pending'
  return 'upcoming'
}

function getDisplayName(name: string | null, isBye: boolean) {
  if (name) return name
  if (isBye) return 'BYE'
  return 'TBD'
}

export default function BracketView({
  matches,
  section = 'winners',
  onSelectWinner,
  onDropPlayer,
  adminMode,
}: Props) {
  const scopedMatches = matches.filter(match => match.section === section)
  if (!scopedMatches.length) {
    return (
      <TournamentBracket
        format="single-elimination"
        sections={[]}
        emptyMessage="Сетка еще не сформирована."
      />
    )
  }

  const maxRound = Math.max(...scopedMatches.map(match => match.round))

  const rounds = Array.from({ length: maxRound }, (_, roundIndex) => {
    const round = roundIndex + 1
    const roundMatches = scopedMatches
      .filter(match => match.round === round)
      .sort((left, right) => left.match_index - right.match_index)
      .map(match => ({
        id: String(match.id),
        round: match.round,
        position: match.match_index + 1,
        status: normalizeStatus(match) as 'upcoming' | 'live' | 'finished' | 'cancelled' | 'pending' | 'bye',
        matchFormat: match.match_format ?? 'BO1',
        startTime: match.start_time ?? null,
        winnerName: match.winner_name,
        participants: [
          {
            name: getDisplayName(match.player1_name, false),
            score: match.score1,
            isWinner: !!match.player1_name && match.winner_name === match.player1_name,
            isTBD: !match.player1_name,
          },
          {
            name: getDisplayName(match.player2_name, match.is_bye),
            score: match.score2,
            isWinner: !!match.player2_name && match.winner_name === match.player2_name,
            isTBD: !match.player2_name && !match.is_bye,
            isBye: match.is_bye && !match.player2_name,
          },
        ] as [
          {
            name: string
            score: number | null
            isWinner: boolean
            isTBD: boolean
          },
          {
            name: string
            score: number | null
            isWinner: boolean
            isTBD: boolean
            isBye: boolean
          },
        ],
        raw: match,
      }))

    return {
      id: `${section}-round-${round}`,
      title: getRoundTitle(round, maxRound),
      round,
      matches: roundMatches,
    }
  })

  const sectionData: BracketSectionData = {
    id: section,
    title: { winners: 'Сетка победителей', losers: 'Сетка проигравших', grand_final: 'Гранд-финал' }[section] ?? section,
    kind: section === 'grand_final' ? 'grand-final' : (section as 'winners' | 'losers'),
    rounds,
  }

  return (
    <TournamentBracket
      format="single-elimination"
      sections={[sectionData]}
      sectionMode="stacked"
      {...(adminMode ? { adminMode: true } : {})}
      {...(onSelectWinner ? { onSelectWinner } : {})}
      {...(onDropPlayer ? { onDropPlayer } : {})}
    />
  )
}
