'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { Calendar, Trophy, Crown, ChevronDown } from 'lucide-react'
import { Navigation } from '../../components/layout'
import { Footer } from '../../components/layout'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

interface Tournament {
  id: number
  title: string
  description: string | null
  game: string | null
  prize: string | null
  challonge_url: string | null
  start_date: string | null
  status: 'upcoming' | 'active' | 'completed'
  winner: string | null
  created_at: string
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Скоро',
  active: 'Идёт',
  completed: 'Завершён',
}

const FILTERS = [
  { value: '', label: 'Все' },
  { value: 'active', label: 'Идут' },
  { value: 'upcoming', label: 'Скоро' },
  { value: 'completed', label: 'Завершены' },
]

function challongeEmbed(url: string): string | null {
  try {
    const u = url.trim().replace(/\/$/, '')
    // Already has /module
    if (u.endsWith('/module')) return u
    // Full challonge URL
    if (u.includes('challonge.com/')) return u + '/module'
    // Just slug
    return `https://challonge.com/${u}/module`
  } catch {
    return null
  }
}

export default function TournamentsPage() {
  const [token, setToken] = useState<string | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY))
  }, [])

  const fetchTournaments = useCallback(async () => {
    setLoading(true)
    try {
      const url = filter
        ? `${API_URL}/api/tournaments/?status=${filter}`
        : `${API_URL}/api/tournaments/`
      const res = await fetch(url)
      const data = await res.json()
      setTournaments(data)
    } catch {
      setTournaments([])
    } finally {
      setLoading(false)
    }
  }, [filter])

  useEffect(() => { fetchTournaments() }, [fetchTournaments])

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <h1 className={styles.pageTitle}>Турниры</h1>
          <p className={styles.pageSubtitle}>Соревнования сообщества Лесной Команды</p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {FILTERS.map(f => (
            <button
              key={f.value}
              className={`${styles.filterBtn} ${filter === f.value ? styles.filterActive : ''}`}
              onClick={() => setFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        <div className={styles.list}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className={styles.skeleton} />)
          ) : tournaments.length === 0 ? (
            <div className={styles.empty}>
              <p>Турниров пока нет</p>
            </div>
          ) : (
            tournaments.map(t => (
              <article key={t.id} className={`${styles.card} ${styles[`card_${t.status}`]}`}>
                <div className={styles.cardTop}>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.statusBadge} ${styles[`status_${t.status}`]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    {t.game && <span className={styles.gameBadge}>{t.game}</span>}
                  </div>

                  <h2 className={styles.cardTitle}>{t.title}</h2>

                  {t.description && <p className={styles.cardDesc}>{t.description}</p>}

                  <div className={styles.cardInfo}>
                    {t.start_date && (
                      <span className={styles.infoItem}>
                        <Calendar size={14} />
                        {fmtDate(t.start_date)}
                      </span>
                    )}
                    {t.prize && (
                      <span className={styles.infoItem}>
                        <Trophy size={14} />
                        {t.prize}
                      </span>
                    )}
                  </div>

                  {/* Winner */}
                  {t.status === 'completed' && t.winner && (
                    <div className={styles.winnerBanner}>
                      <Crown size={20} />
                      <div>
                        <span className={styles.winnerLabel}>Победитель</span>
                        <span className={styles.winnerName}>{t.winner}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Bracket toggle */}
                {t.challonge_url && (t.status === 'active' || t.status === 'completed') && (
                  <div className={styles.bracketSection}>
                    <button
                      className={styles.bracketToggle}
                      onClick={() => setExpanded(expanded === t.id ? null : t.id)}
                    >
                      {expanded === t.id ? 'Скрыть сетку' : 'Смотреть сетку'}
                      <ChevronDown
                        size={16}
                        style={{ transform: expanded === t.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                      />
                    </button>

                    {expanded === t.id && (
                      <div className={styles.bracketEmbed}>
                        <iframe
                          src={challongeEmbed(t.challonge_url) ?? ''}
                          width="100%"
                          height="500"
                          frameBorder="0"
                          scrolling="auto"
                          allowTransparency={true}
                          title={`Сетка: ${t.title}`}
                        />
                      </div>
                    )}
                  </div>
                )}
              </article>
            ))
          )}
        </div>
      </main>
      <Footer />
    </>
  )
}
