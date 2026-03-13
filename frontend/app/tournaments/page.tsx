'use client'

import { useEffect, useState, useCallback } from 'react'
import { Calendar, Trophy, Crown, ChevronDown, X, Users } from 'lucide-react'
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
  image_url: string | null
  type: '1v1' | '5v5'
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
    if (u.endsWith('/module')) return u
    if (u.includes('challonge.com/')) return u + '/module'
    return `https://challonge.com/${u}/module`
  } catch {
    return null
  }
}

// ── Registration Modal ─────────────────────────────────────────────────────

interface RegModalProps {
  tournament: Tournament
  onClose: () => void
  apiUrl: string
}

function RegistrationModal({ tournament, onClose, apiUrl }: RegModalProps) {
  const isSolo = tournament.type === '1v1'
  const [nickname, setNickname] = useState('')
  const [discord, setDiscord] = useState('')
  const [steam, setSteam] = useState('')
  const [teamName, setTeamName] = useState('')
  const [players, setPlayers] = useState(['', '', '', '', ''])
  const [contact, setContact] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token || !isSolo) return
    fetch(`${apiUrl}/api/profile`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return
        setNickname(data.site_nickname || data.discord_username || '')
        setDiscord(data.discord_username || '')
      })
      .catch(() => {})
  }, [apiUrl, isSolo])

  const handleSubmit = async () => {
    setError('')
    if (isSolo) {
      if (!nickname.trim()) { setError('Укажи никнейм'); return }
    } else {
      if (!teamName.trim()) { setError('Укажи название команды'); return }
      if (players.some(p => !p.trim())) { setError('Заполни никнеймы всех 5 игроков'); return }
      if (!contact.trim()) { setError('Укажи контакт капитана'); return }
    }
    setSubmitting(true)
    try {
      const endpoint = isSolo
        ? `${apiUrl}/api/tournaments/${tournament.id}/register/solo`
        : `${apiUrl}/api/tournaments/${tournament.id}/register/team`
      const body = isSolo
        ? { nickname, discord: discord || null, steam: steam || null }
        : { team_name: teamName, players, contact }
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) { setError('Ошибка при отправке, попробуй позже'); return }
      setSuccess(true)
    } catch {
      setError('Ошибка сети')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.modalOverlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modalBox}>
        <div className={styles.modalHead}>
          <h3>Регистрация: {tournament.title}</h3>
          <button className={styles.modalClose} onClick={onClose}><X size={18} /></button>
        </div>

        {success ? (
          <div className={styles.modalBody}>
            <p className={styles.modalSuccess}>Заявка отправлена! Ждём тебя на турнире.</p>
          </div>
        ) : (
          <>
            <div className={styles.modalBody}>
              {isSolo ? (
                <>
                  <label className={styles.fieldLabel}>
                    Никнейм *
                    <input className={styles.fieldInput} value={nickname} onChange={e => setNickname(e.target.value)} placeholder="Твой игровой ник" />
                  </label>
                  <label className={styles.fieldLabel}>
                    Discord
                    <input className={styles.fieldInput} value={discord} onChange={e => setDiscord(e.target.value)} placeholder="username#0000" />
                  </label>
                  <label className={styles.fieldLabel}>
                    Steam (ссылка или ник)
                    <input className={styles.fieldInput} value={steam} onChange={e => setSteam(e.target.value)} placeholder="https://steamcommunity.com/id/..." />
                  </label>
                </>
              ) : (
                <>
                  <label className={styles.fieldLabel}>
                    Название команды *
                    <input className={styles.fieldInput} value={teamName} onChange={e => setTeamName(e.target.value)} placeholder="Название команды" />
                  </label>
                  {players.map((p, i) => (
                    <label key={i} className={styles.fieldLabel}>
                      Игрок {i + 1} *
                      <input
                        className={styles.fieldInput}
                        value={p}
                        onChange={e => setPlayers(prev => prev.map((x, j) => j === i ? e.target.value : x))}
                        placeholder={`Никнейм игрока ${i + 1}`}
                      />
                    </label>
                  ))}
                  <label className={styles.fieldLabel}>
                    Контакт капитана (Discord или Telegram) *
                    <input className={styles.fieldInput} value={contact} onChange={e => setContact(e.target.value)} placeholder="@username или discord#0000" />
                  </label>
                </>
              )}
              {error && <p className={styles.modalError}>{error}</p>}
            </div>
            <div className={styles.modalFoot}>
              <button className={styles.modalCancel} onClick={onClose}>Отмена</button>
              <button className={styles.modalSubmit} onClick={handleSubmit} disabled={submitting}>
                {submitting ? 'Отправка...' : 'Зарегистрироваться'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function TournamentsPage() {
  const [token, setToken] = useState<string | null>(null)
  const [tournaments, setTournaments] = useState<Tournament[]>([])
  const [filter, setFilter] = useState('')
  const [expanded, setExpanded] = useState<number | null>(null)
  const [loading, setLoading] = useState(true)
  const [regTarget, setRegTarget] = useState<Tournament | null>(null)

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

        <div className={styles.list}>
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => <div key={i} className={styles.skeleton} />)
          ) : tournaments.length === 0 ? (
            <div className={styles.empty}><p>Турниров пока нет</p></div>
          ) : (
            tournaments.map(t => (
              <article key={t.id} className={`${styles.card} ${styles[`card_${t.status}`]}`}>
                {t.image_url && (
                  <img src={t.image_url} alt={t.title} className={styles.cardImage} />
                )}

                <div className={styles.cardTop}>
                  <div className={styles.cardMeta}>
                    <span className={`${styles.statusBadge} ${styles[`status_${t.status}`]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                    <span className={styles.typeBadge}>
                      <Users size={11} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
                      {t.type}
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

                  {t.status === 'completed' && t.winner && (
                    <div className={styles.winnerBanner}>
                      <Crown size={20} />
                      <div>
                        <span className={styles.winnerLabel}>Победитель</span>
                        <span className={styles.winnerName}>{t.winner}</span>
                      </div>
                    </div>
                  )}

                  {t.status !== 'completed' && (
                    <button className={styles.registerBtn} onClick={() => setRegTarget(t)}>
                      Зарегистрироваться
                    </button>
                  )}
                </div>

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

      {regTarget && (
        <RegistrationModal
          tournament={regTarget}
          onClose={() => setRegTarget(null)}
          apiUrl={API_URL}
        />
      )}
    </>
  )
}
