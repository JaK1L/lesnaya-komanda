'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { ChevronLeft, Trophy } from 'lucide-react'
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

function groupMatches(matches: Match[]) {
  const sections: Record<string, Record<number, Match[]>> = {}
  for (const m of matches) {
    if (!sections[m.section]) sections[m.section] = {}
    if (!sections[m.section][m.round]) sections[m.section][m.round] = []
    sections[m.section][m.round].push(m)
  }
  // Sort matches within each round by match_index
  for (const sec of Object.values(sections)) {
    for (const rnd of Object.values(sec)) {
      rnd.sort((a, b) => a.match_index - b.match_index)
    }
  }
  return sections
}

function MatchCard({ match }: { match: Match }) {
  const p1Won = match.winner_name && match.winner_name === match.player1_name
  const p2Won = match.winner_name && match.winner_name === match.player2_name

  return (
    <div className={`${styles.match} ${match.status === 'completed' ? styles.completed : ''} ${match.is_bye ? styles.bye : ''}`}>
      <div className={`${styles.player} ${p1Won ? styles.winner : ''} ${match.status !== 'bye' && !match.player1_name ? styles.tbd : ''}`}>
        <span className={styles.playerName}>{match.player1_name || 'TBD'}</span>
        {match.score1 !== null && <span className={styles.score}>{match.score1}</span>}
        {p1Won && <Trophy size={12} className={styles.trophy} />}
      </div>
      <div className={`${styles.player} ${p2Won ? styles.winner : ''} ${match.status !== 'bye' && !match.player2_name ? styles.tbd : ''}`}>
        <span className={styles.playerName}>{match.is_bye ? 'BYE' : (match.player2_name || 'TBD')}</span>
        {match.score2 !== null && <span className={styles.score}>{match.score2}</span>}
        {p2Won && <Trophy size={12} className={styles.trophy} />}
      </div>
    </div>
  )
}

function BracketSection({ title, rounds }: { title: string; rounds: Record<number, Match[]> }) {
  const roundNums = Object.keys(rounds).map(Number).sort((a, b) => a - b)
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{title}</h3>
      <div className={styles.rounds}>
        {roundNums.map(r => (
          <div key={r} className={styles.round}>
            <div className={styles.roundLabel}>Раунд {r}</div>
            <div className={styles.matchList}>
              {rounds[r].filter(m => !m.is_bye).map(m => (
                <MatchCard key={m.id} match={m} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const SECTION_LABELS: Record<string, string> = {
  winners: 'Сетка победителей',
  losers: 'Сетка проигравших',
  grand_final: 'Гранд-финал',
}

export default function BracketPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [empty, setEmpty] = useState(false)

  useEffect(() => {
    axios.get<Match[]>(`${API_URL}/api/tournaments/${id}/bracket`)
      .then(r => {
        if (r.data.length === 0) setEmpty(true)
        else setMatches(r.data)
      })
      .catch(() => setEmpty(true))
      .finally(() => setLoading(false))
  }, [id])

  const sections = groupMatches(matches)
  const sectionOrder = ['winners', 'losers', 'grand_final']

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <button className={styles.back} onClick={() => router.push('/tournaments')}>
          <ChevronLeft size={18} /> Турниры
        </button>
        <h1 className={styles.title}>Турнирная сетка</h1>
      </div>

      {loading && <div className={styles.loading}><div className={styles.spinner} /></div>}

      {empty && !loading && (
        <div className={styles.empty}>
          <p>Сетка ещё не сформирована.</p>
          <p>Организаторы запустят её после окончания регистрации.</p>
        </div>
      )}

      {!loading && !empty && (
        <div className={styles.bracket}>
          {sectionOrder
            .filter(s => sections[s])
            .map(s => (
              <BracketSection key={s} title={SECTION_LABELS[s] || s} rounds={sections[s]} />
            ))}
        </div>
      )}
    </div>
  )
}
