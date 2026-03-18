'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { TournamentBracket } from '../../../../components/tournament'
import type { BracketSectionData } from '../../../../components/tournament'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Match {
  id: number
  bracket_type: string
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
}

const SECTION_LABELS: Record<string, string> = {
  winners: 'Сетка победителей',
  losers: 'Сетка проигравших',
  grand_final: 'Гранд-финал',
}

function normalizeStatus(match: Match) {
  if (match.is_bye) return 'bye'
  if (match.status === 'completed') return 'finished'
  if (match.status === 'cancelled') return 'cancelled'
  if (match.status === 'live') return 'live'
  if (!match.player1_name || !match.player2_name) return 'pending'
  return 'upcoming'
}

function getRoundTitle(round: number, totalRounds: number) {
  if (round === totalRounds) return totalRounds > 1 ? 'Финал' : 'Матч'
  if (round === totalRounds - 1 && totalRounds > 2) return 'Полуфинал'
  return `Раунд ${round}`
}

function buildSections(matches: Match[]): BracketSectionData[] {
  const grouped = new Map<string, Match[]>()

  matches.forEach(match => {
    const list = grouped.get(match.section) ?? []
    list.push(match)
    grouped.set(match.section, list)
  })

  return ['winners', 'losers', 'grand_final']
    .filter(section => grouped.has(section))
    .map(section => {
      const scopedMatches = (grouped.get(section) ?? []).sort((left, right) => {
        if (left.round !== right.round) return left.round - right.round
        return left.match_index - right.match_index
      })

      const maxRound = Math.max(...scopedMatches.map(match => match.round))

      return {
        id: section,
        title: SECTION_LABELS[section] ?? section,
        kind: section === 'grand_final' ? 'grand-final' : (section as 'winners' | 'losers'),
        rounds: Array.from({ length: maxRound }, (_, roundIndex) => {
          const round = roundIndex + 1
          const roundMatches = scopedMatches
            .filter(match => match.round === round)
            .sort((left, right) => left.match_index - right.match_index)
            .map(match => ({
              id: String(match.id),
              round,
              position: match.match_index + 1,
              status: normalizeStatus(match) as 'upcoming' | 'live' | 'finished' | 'cancelled' | 'pending' | 'bye',
              winnerName: match.winner_name,
              participants: [
                {
                  name: match.player1_name ?? 'TBD',
                  score: match.score1,
                  isWinner: !!match.player1_name && match.winner_name === match.player1_name,
                  isTBD: !match.player1_name,
                },
                {
                  name: match.is_bye && !match.player2_name ? 'BYE' : (match.player2_name ?? 'TBD'),
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
            }))

          return {
            id: `${section}-round-${round}`,
            title: getRoundTitle(round, maxRound),
            round,
            matches: roundMatches,
          }
        }),
      }
    })
}

export default function BracketPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    fetch(`${API_URL}/api/tournaments/${id}/bracket`)
      .then(async response => {
        if (!response.ok) throw new Error('Не удалось получить турнирную сетку.')
        return response.json()
      })
      .then(data => {
        if (!active) return
        setMatches(Array.isArray(data) ? data : [])
      })
      .catch(() => {
        if (!active) return
        setError('Не удалось загрузить сетку. Попробуйте обновить страницу позже.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    return () => {
      active = false
    }
  }, [id])

  const sections = buildSections(matches)
  const format = sections.some(section => section.id === 'losers' || section.id === 'grand_final')
    ? 'double-elimination'
    : 'single-elimination'

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.push('/tournaments')}>
          <ChevronLeft size={18} /> Турниры
        </button>
        <h1 className={styles.title}>Турнирная сетка</h1>
      </div>

      <div className={styles.viewport}>
      <TournamentBracket
        title={`Турнир #${id}`}
        format={format}
        sections={sections}
        loading={loading}
        error={error}
        emptyMessage="Сетка еще не сформирована. Организаторы опубликуют ее после завершения регистрации."
        sectionMode="tabs"
      />
      </div>
    </div>
  )
}
