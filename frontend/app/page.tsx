'use client'
// Vercel build: no unused imports
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Gamepad2, TreePine, Sword, Target, Shield, ChevronRight, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'

interface Player {
  discord_username: string
  forest_rank: string
  rating: number
  discord_id: number
  message_count?: number
  voice_hours?: number
}

interface Stats {
  members: number
  online: number
  achievements: number
}

interface DiscordTopMessagesRow {
  discord_id: number
  discord_username: string
  messages: number
}

interface DiscordTopVoiceRow {
  discord_id: number
  discord_username: string
  seconds: number
  hours: number
}

interface DiscordNowPlayingRow {
  discord_id: number
  discord_username: string
  status: string
  activity_type?: string | null
  activity_name: string
  updated_at: string
}

interface DiscordOverview {
  online: number
  top_messages: DiscordTopMessagesRow[]
  top_voice: DiscordTopVoiceRow[]
  now_playing: DiscordNowPlayingRow[]
}

interface EventItem {
  id: number
  title: string
  description: string
  game: string
  event_date: string | null
  status?: string | null
}

interface FeedItem {
  id: number
  kind: 'post' | 'achievement'
  title: string
  content: string | null
  created_at: string
}

interface CommonSettings {
  discord_join_url: string
  maintenance_enabled: boolean
  maintenance_message?: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

export default function Home() {
  const [players, setPlayers] = useState<Player[]>([])
  const [stats, setStats] = useState<Stats>({
    members: 70,
    online: 12,
    achievements: 150
  })
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [discordOverview, setDiscordOverview] = useState<DiscordOverview | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [commonSettings, setCommonSettings] = useState<CommonSettings | null>(null)

  // После входа через Discord бэкенд редиректит с ?token=... — сохраняем и убираем из URL
  useEffect(() => {
    if (typeof window === 'undefined') return
    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    const login = params.get('login')
    if (t && login === 'discord') {
      localStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      window.history.replaceState({}, '', window.location.pathname)
    } else {
      setToken(localStorage.getItem(TOKEN_KEY))
    }
  }, [])

  useEffect(() => {
    fetchData()
  }, [])

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const [playersRes, statsRes, discordRes, eventsRes, feedRes, commonRes] = await Promise.all([
        axios.get<Player[]>(`${API_URL}/api/players?limit=6`),
        axios.get<Stats>(`${API_URL}/api/stats`),
        axios.get<DiscordOverview>(`${API_URL}/api/discord/overview`),
        axios.get<EventItem[]>(`${API_URL}/api/events`),
        axios.get<FeedItem[]>(`${API_URL}/api/feed`),
        axios.get<CommonSettings>(`${API_URL}/api/settings/common`),
      ])
      setPlayers(playersRes.data)
      setStats(statsRes.data)
      setDiscordOverview(discordRes.data)
      setEvents(eventsRes.data)
      setFeed(feedRes.data)
      setCommonSettings(commonRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Не удалось загрузить данные')
      setPlayers([
        { discord_username: 'JaK1L', forest_rank: '🐺 СТАРЫЙ ВОЛК', rating: 95, discord_id: 123456789 },
        { discord_username: 'DIMA_DIMA', forest_rank: '🌲 ДЕРЕВО', rating: 45, discord_id: 987654321 },
        { discord_username: 'ЛЕСНОЙ_ДУХ', forest_rank: '🔥 ЛЕСНОЙ ДУХ', rating: 72, discord_id: 111222333 },
        { discord_username: 'СНАЙПЕР', forest_rank: '🌿 ТРАВА', rating: 28, discord_id: 444555666 },
        { discord_username: 'СТРЕЛОК', forest_rank: '🪵 БРЕВНО', rating: 35, discord_id: 777888999 },
        { discord_username: 'КОРОЛЬ ЛЕСА', forest_rank: '🔥 ЛЕСНОЙ ДУХ', rating: 88, discord_id: 999888777 },
      ])
    } finally {
      setLoading(false)
    }
  }

  const games = [
    { name: 'CS2', icon: Target, players: 15, color: '#ffaa00' },
    { name: 'DOTA 2', icon: Sword, players: 12, color: '#ff4444' },
    { name: 'VALORANT', icon: Shield, players: 8, color: '#ff6b6b' },
    { name: 'ДРУГИЕ', icon: Gamepad2, players: 35, color: '#4aff75' },
  ]

  const posts = feed.filter((item) => item.kind === 'post')
  const achievementsFeed = feed.filter((item) => item.kind === 'achievement')

  return (
    <>
      {/* Навигация */}
      <nav className="nav">
        <div className="container nav-container">
          <a href="/" className="nav-logo">
            <TreePine size={32} />
            <span>ЛЕСНАЯ КОМАНДА</span>
          </a>
          <div className="nav-links">
            <a href="#games" className="nav-link">ИГРЫ</a>
            <a href="#players" className="nav-link">ИГРОКИ</a>
            <a href="#achievements" className="nav-link">ДОСТИЖЕНИЯ</a>
            {token ? (
              <button type="button" onClick={handleLogout} className="lunacy-button" style={{ padding: '0.75rem 1.5rem' }}>
                ВЫЙТИ
              </button>
            ) : (
              <a href={`${API_URL}/api/auth/discord`} className="lunacy-button" style={{ padding: '0.75rem 1.5rem' }}>
                ВОЙТИ ЧЕРЕЗ DISCORD
              </a>
            )}
          </div>
        </div>
      </nav>

      <main className="container">
        {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</p>}
        {/* Hero секция в стиле Lunacy */}
        <div className="hero-block">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1>ЛЕСНАЯ<br />КОМАНДА</h1>
            <p>
              Мы — своя стая. Играем в CS2, Dota 2, Valorant и всё, что под руку попадётся.
              Без понтов, без маркетологов в пиджаках. Просто геймеры, которые нашли друг друга.
            </p>
              <a
                href={commonSettings?.discord_join_url || '#'}
                target="_blank"
                rel="noreferrer"
                className="lunacy-button"
                style={{ marginTop: '2rem' }}
              >
                ВСТУПИТЬ В СТАЮ{' '}
                <ChevronRight
                  size={16}
                  style={{ marginLeft: '0.5rem', display: 'inline' }}
                />
              </a>
          </motion.div>

        {/* Новости стаи */}
        <section style={{ marginTop: '4rem' }}>
          <h2>ЧТО ПРОИСХОДИТ В СТАЕ</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1px',
              background: 'var(--gray-light)',
              border: '1px solid var(--gray-light)',
            }}
          >
            {(posts.length ? posts : []).slice(0, 4).map((item) => {
              const dateLabel = new Date(item.created_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div key={item.id} className="game-card" style={{ background: 'var(--gray)' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--accent)',
                        fontFamily: 'Unbounded',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      ЛЕНТА
                    </span>
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>{dateLabel}</span>
                  </div>
                  <div className="game-name" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    {item.title}
                  </div>
                  {item.content && (
                    <div className="game-players" style={{ whiteSpace: 'pre-line' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              )
            })}

            {posts.length === 0 && (
              <div className="game-card" style={{ background: 'var(--gray)' }}>
                <div className="game-name" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  В стае пока тихо
                </div>
                <div className="game-players">
                  Как только админ напишет первый пост в /admin/feed, здесь появится живая лента.
                </div>
              </div>
            )}
          </div>
        </section>
        </div>

        {/* Баннер техработ */}
        {commonSettings?.maintenance_enabled && (
          <div className="stat-grid" style={{ marginTop: '0' }}>
            <div className="stat-item" style={{ gridColumn: '1 / -1' }}>
              <div className="stat-label" style={{ color: '#facc15' }}>
                ТЕХНИЧЕСКИЕ РАБОТЫ
              </div>
              <div className="game-players">
                {commonSettings.maintenance_message ||
                  'Сейчас в стае идут техработы. Возможны лаги и вылеты.'}
              </div>
            </div>
          </div>
        )}

        {/* Статистика */}
        <div className="stat-grid">
          <div className="stat-item">
            <div className="stat-number">{loading ? '…' : stats.members}</div>
            <div className="stat-label">ВОЛКОВ В СТАЕ</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{loading ? '…' : (discordOverview?.online ?? stats.online)}</div>
            <div className="stat-label">ОНЛАЙН СЕЙЧАС</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{loading ? '…' : `${stats.achievements}+`}</div>
            <div className="stat-label">ДОСТИЖЕНИЙ</div>
          </div>
        </div>

        {/* Discord статистика */}
        {discordOverview && (
          <section style={{ marginTop: '4rem' }}>
            <h2>ЧТО ПРОИСХОДИТ В DISCORD</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1px', background: 'var(--gray-light)', border: '1px solid var(--gray-light)' }}>
              <div className="game-card" style={{ background: 'var(--gray)' }}>
                <div className="game-name" style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>🎮 Кто во что играет</div>
                {discordOverview.now_playing.length === 0 ? (
                  <div className="game-players">Пока никто не играет</div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {discordOverview.now_playing.slice(0, 5).map((row) => (
                      <div key={row.discord_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                        <span style={{ color: '#fff' }}>{row.discord_username}</span>
                        <span style={{ color: '#aaa', textAlign: 'right' }}>{row.activity_name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="game-card" style={{ background: 'var(--gray)' }}>
                <div className="game-name" style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>💬 Топ по сообщениям</div>
                {discordOverview.top_messages.length === 0 ? (
                  <div className="game-players">Нет данных</div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {discordOverview.top_messages.slice(0, 3).map((row, i) => (
                      <div key={row.discord_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                        <span style={{ color: '#fff' }}>{i + 1}. {row.discord_username}</span>
                        <span style={{ color: '#aaa' }}>{row.messages}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="game-card" style={{ background: 'var(--gray)' }}>
                <div className="game-name" style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>🎤 Топ по голосу</div>
                {discordOverview.top_voice.length === 0 ? (
                  <div className="game-players">Нет данных</div>
                ) : (
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {discordOverview.top_voice.slice(0, 3).map((row, i) => (
                      <div key={row.discord_id} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem' }}>
                        <span style={{ color: '#fff' }}>{i + 1}. {row.discord_username}</span>
                        <span style={{ color: '#aaa' }}>{row.hours} ч</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* Игры */}
        <section id="games" style={{ marginTop: '6rem' }}>
          <h2>ВО ЧТО ИГРАЕМ</h2>
          <div className="games-grid">
            {games.map((game, index) => (
              <div key={index} className="game-card">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <game.icon className="game-icon" size={32} style={{ color: game.color }} />
                  <div className="game-name">{game.name}</div>
                  <div className="game-players">{game.players} ИГРОКОВ</div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* Игроки */}
        <section id="players" style={{ marginTop: '6rem' }}>
          <h2>АКТИВНЫЕ ВОЛКИ</h2>
          <div className="players-grid">
            {players.map((player: Player, index) => (
              <div key={index} className="player-card">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <div className="player-avatar">
                    {player.discord_username?.[0] || '🐺'}
                  </div>
                  <div className="player-info">
                    <div className="player-name">{player.discord_username}</div>
                    <div className="player-rank">{player.forest_rank}</div>
                  </div>
                  <div className="player-rating">{player.rating}</div>
                </motion.div>
              </div>
            ))}
          </div>
        </section>

        {/* Достижения */}
        <section id="achievements" style={{ marginTop: '6rem' }}>
          <h2>ДОСТИЖЕНИЯ</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1px',
              background: 'var(--gray-light)',
              border: '1px solid var(--gray-light)',
            }}
          >
            {(achievementsFeed.length ? achievementsFeed : []).slice(0, 4).map((item) => {
              const dateLabel = new Date(item.created_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
              })
              return (
                <div key={item.id} className="game-card" style={{ background: 'var(--gray)' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '0.75rem',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--accent)',
                        fontFamily: 'Unbounded',
                        fontWeight: 700,
                        fontSize: '0.75rem',
                      }}
                    >
                      ДОСТИЖЕНИЕ
                    </span>
                    <span style={{ color: '#666', fontSize: '0.75rem' }}>{dateLabel}</span>
                  </div>
                  <div className="game-name" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                    {item.title}
                  </div>
                  {item.content && (
                    <div className="game-players" style={{ whiteSpace: 'pre-line' }}>
                      {item.content}
                    </div>
                  )}
                </div>
              )
            })}

            {achievementsFeed.length === 0 && (
              <div className="game-card" style={{ background: 'var(--gray)' }}>
                <div className="game-name" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Тут скоро будут легенды
                </div>
                <div className="game-players">
                  Заносите сюда клатчи, смешные моменты и победы через /admin/feed (тип «Достижение»).
                </div>
              </div>
            )}
          </div>
        </section>

        {/* События в стиле Lunacy */}
        <section style={{ marginTop: '6rem' }}>
          <h2>СОБЫТИЯ В ЛЕСУ</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
              gap: '1px',
              background: 'var(--gray-light)',
              border: '1px solid var(--gray-light)',
            }}
          >
            {(events.length
              ? events
              : [
                  {
                    id: 0,
                    title: 'CS2 КЛАТЧ-ТУРНИР',
                    description: 'Собираем 5 команд для вечерних замесов',
                    game: 'CS2',
                    event_date: null,
                    status: 'Планируется',
                  },
                  {
                    id: 1,
                    title: 'DOTA 2 ИНХАУС',
                    description: 'Играем 5х5, все уровни приветствуются',
                    game: 'DOTA 2',
                    event_date: null,
                    status: 'Идёт набор',
                  },
                  {
                    id: 2,
                    title: 'VALORANT ТУРНИР',
                    description: 'Приз — звание "Лесной Ас"',
                    game: 'VALORANT',
                    event_date: null,
                    status: 'Скоро',
                  },
                ]
            ).map((event, index) => {
              const dateLabel = event.event_date
                ? new Date(event.event_date).toLocaleString('ru-RU', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : null

              return (
                <div
                  key={event.id ?? index}
                  className="game-card"
                  style={{ background: 'var(--gray)' }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: '1rem',
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--accent)',
                        fontFamily: 'Unbounded',
                        fontWeight: 700,
                        fontSize: '0.875rem',
                      }}
                    >
                      {event.game || 'СОБЫТИЕ'}
                    </span>
                    <span
                      style={{
                        color: '#666',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'flex-end',
                        gap: '0.1rem',
                        fontSize: '0.75rem',
                      }}
                    >
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Calendar size={14} />
                        {dateLabel ?? 'Скоро'}
                      </span>
                      {event.status && (
                        <span style={{ color: '#facc15', textTransform: 'uppercase' }}>
                          {event.status}
                        </span>
                      )}
                    </span>
                  </div>
                  <div
                    className="game-name"
                    style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}
                  >
                    {event.title}
                  </div>
                  <div className="game-players">{event.description}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Футер */}
        <footer className="footer">
          <p>© 2026 ЛЕСНАЯ КОМАНДА. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</p>
          <p style={{ marginTop: '0.5rem' }}>СДЕЛАНО С 🌲 В ЛЕСУ</p>
        </footer>
      </main>
    </>
  )
}