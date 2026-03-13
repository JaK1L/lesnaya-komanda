'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
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
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 3h-1V1h-2v2H8V1H6v2H5C3.89 3 3 3.9 3 5v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z"/>
                        </svg>
                        {fmtDate(t.start_date)}
                      </span>
                    )}
                    {t.prize && (
                      <span className={styles.infoItem}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z"/>
                        </svg>
                        {t.prize}
                      </span>
                    )}
                  </div>

                  {/* Winner */}
                  {t.status === 'completed' && t.winner && (
                    <div className={styles.winnerBanner}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M19 5h-2V3H7v2H5C3.9 5 3 5.9 3 7v1c0 2.55 1.92 4.63 4.39 4.94A5.01 5.01 0 0 0 11 15.9V18H9v2h6v-2h-2v-2.1a5.01 5.01 0 0 0 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2z"/>
                      </svg>
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
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                        style={{ transform: expanded === t.id ? 'rotate(180deg)' : 'none', transition: '0.2s' }}
                      >
                        <path d="M7 10l5 5 5-5z"/>
                      </svg>
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
