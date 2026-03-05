'use client'
// Vercel build: no unused imports
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Gamepad2, TreePine, Sword, Target, Shield, ChevronRight, Calendar } from 'lucide-react'
import { motion } from 'framer-motion'
import { DiscordActivityGrid } from '../components/DiscordActivityGrid'
import { MinecraftXPBar } from '../components/MinecraftXPBar'
import { GamePreferencesModal } from '../components/GamePreferencesModal'
import { GameStatistics } from '../types/gamePreferences'
import './mobile-styles.css'

interface Player {
  discord_username: string
  forest_rank: string
  rating: number
  discord_id: number
  message_count?: number
  voice_hours?: number
  avatar_url?: string | null
  status?: string
  is_online?: boolean
}

interface Stats {
  members: number
  online: number
  achievements: number
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
  const [elitePlayers, setElitePlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [events, setEvents] = useState<EventItem[]>([])
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [commonSettings, setCommonSettings] = useState<CommonSettings | null>(null)
  const [stats, setStats] = useState<Stats>({
    members: 70,
    online: 12,
    achievements: 150
  })
  const [showGamePreferencesModal, setShowGamePreferencesModal] = useState(false)
  const [gameStats, setGameStats] = useState<GameStatistics | null>(null)

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
      // Check if user needs to fill game preferences
      checkGamePreferences(t)
    } else {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      setToken(storedToken)
      if (storedToken) {
        checkGamePreferences(storedToken)
      }
    }
  }, [])

  useEffect(() => {
    fetchData()
    fetchGameStatistics()
  }, [])

  const checkGamePreferences = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      
      // Show modal if game_preferences is null
      if (response.data.game_preferences === null) {
        setShowGamePreferencesModal(true)
      }
    } catch (err) {
      console.error('Error checking game preferences:', err)
    }
  }

  const fetchGameStatistics = async () => {
    try {
      const response = await axios.get<GameStatistics>(`${API_URL}/api/games/statistics`)
      setGameStats(response.data)
    } catch (err) {
      console.error('Error fetching game statistics:', err)
    }
  }

  const handleGamePreferencesSaved = () => {
    // Refresh game statistics after saving preferences
    fetchGameStatistics()
  }

  const handleGamePreferencesSkipped = () => {
    // Just close modal, statistics remain unchanged
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  const fetchData = async (): Promise<void> => {
    try {
      setLoading(true)
      setError(null)
      const [statsRes, eventsRes, feedRes, commonRes, eliteRes] = await Promise.all([
        axios.get<Stats>(`${API_URL}/api/stats`),
        axios.get<EventItem[]>(`${API_URL}/api/events`),
        axios.get<FeedItem[]>(`${API_URL}/api/feed`),
        axios.get<CommonSettings>(`${API_URL}/api/settings/common`),
        axios.get<Player[]>(`${API_URL}/api/discord/elite`),
      ])
      setStats(statsRes.data)
      setEvents(eventsRes.data)
      setFeed(feedRes.data)
      setCommonSettings(commonRes.data)
      setElitePlayers(eliteRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Не удалось загрузить данные')
      setElitePlayers([])
    } finally {
      setLoading(false)
    }
  }

  const games = [
    { name: 'CS2', icon: Target, players: gameStats?.CS2 ?? 0, color: '#ffaa00' },
    { name: 'DOTA 2', icon: Sword, players: gameStats?.['DOTA 2'] ?? 0, color: '#ff4444' },
    { name: 'VALORANT', icon: Shield, players: gameStats?.VALORANT ?? 0, color: '#ff6b6b' },
    { name: 'ДРУГИЕ', icon: Gamepad2, players: gameStats?.['ДРУГИЕ'] ?? 0, color: '#4aff75' },
  ]

  const posts = feed.filter((item) => item.kind === 'post')
  const achievementsFeed = feed.filter((item) => item.kind === 'achievement')

  return (
    <>
      {/* Minecraft XP Bar - только для авторизованных */}
      {token && <MinecraftXPBar currentXP={0} maxXP={100} level={0} />}
      
      {/* Game Preferences Modal */}
      <GamePreferencesModal
        isOpen={showGamePreferencesModal}
        onClose={() => setShowGamePreferencesModal(false)}
        onSave={handleGamePreferencesSaved}
        onSkip={handleGamePreferencesSkipped}
      />
      
      {/* Навигация */}
      <nav className="nav">
        <div className="container nav-container">
          <a href="/" className="nav-logo">
            <TreePine size={32} />
            <span>ЛЕСНАЯ КОМАНДА</span>
          </a>
          <div className="nav-links">
            <a href="/" className="nav-link">ГЛАВНАЯ</a>
            <a href="/merch" className="nav-link">МЕРЧ</a>
            <a href="/streams" className="nav-link">СТРИМЫ</a>
            <a href="/social" className="nav-link">СОЦ.СЕТИ</a>
            {token ? (
              <>
                <a href="/profile" className="nav-link">ПРОФИЛЬ</a>
                <button type="button" onClick={handleLogout} className="lunacy-button" style={{ padding: '0.75rem 1.5rem' }}>
                  ВЫЙТИ
                </button>
              </>
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
                ВОЙТИ В ЛЕС{' '}
                <ChevronRight
                  size={16}
                  style={{ marginLeft: '0.5rem', display: 'inline' }}
                />
              </a>
          </motion.div>

        {/* Новости стаи */}
        <section style={{ marginTop: '4rem' }}>
          <h2>ЧТО ПРОИСХОДИТ В ЛЕСУ</h2>
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
                  Здесь появится живая лента активности сервера.
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
            <div className="stat-number">{loading ? '…' : stats.online}</div>
            <div className="stat-label">ОНЛАЙН СЕЙЧАС</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{loading ? '…' : `${stats.achievements}+`}</div>
            <div className="stat-label">ДОСТИЖЕНИЙ</div>
          </div>
        </div>

        {/* Discord Activity Cards */}
        <section style={{ marginTop: '4rem' }}>
          <DiscordActivityGrid />
        </section>

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

        {/* Элита леса - пользователи с ролью ПИТУХ */}
        <section id="players" style={{ marginTop: '6rem' }}>
          <h2>ЭЛИТА ЛЕСА</h2>
          <div className="players-grid">
            {elitePlayers.length === 0 && (
              <div className="game-card" style={{ background: 'var(--gray)' }}>
                <div className="game-name" style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>
                  Пока никого
                </div>
                <div className="game-players">
                  Как только бот соберёт данные с Discord, здесь появится элита.
                </div>
              </div>
            )}
            {elitePlayers.map((player: Player, index) => {
                const isOnline = player.is_online || false
                return (
                  <a 
                    key={player.discord_id ?? index} 
                    href={`/profile/${player.discord_id}`}
                    className="player-card"
                    style={{ textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
                  >
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <div className="player-avatar" style={{ position: 'relative' }}>
                        {player.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={player.avatar_url}
                            alt={player.discord_username}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover', 
                              borderRadius: '50%',
                              opacity: isOnline ? 1 : 0.5
                            }}
                          />
                        ) : (
                          <span style={{ opacity: isOnline ? 1 : 0.5 }}>
                            {player.discord_username?.[0] || '🐺'}
                          </span>
                        )}
                        {/* Индикатор онлайн/оффлайн */}
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '2px',
                            right: '2px',
                            width: '12px',
                            height: '12px',
                            borderRadius: '50%',
                            backgroundColor: isOnline ? '#4aff75' : '#747f8d',
                            border: '2px solid var(--bg)',
                          }}
                        />
                      </div>
                      <div className="player-info">
                        <div className="player-name">{player.discord_username}</div>
                        <div className="player-rank">{player.forest_rank}</div>
                        <div style={{ fontSize: '0.75rem', color: isOnline ? '#4aff75' : '#747f8d', marginTop: '0.25rem' }}>
                          {isOnline ? 'Онлайн' : 'Оффлайн'}
                        </div>
                      </div>
                      <div className="player-rating">{player.rating}</div>
                    </motion.div>
                  </a>
                )
              })}
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
                  Заносите сюда клатчи, смешные моменты и победы.
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