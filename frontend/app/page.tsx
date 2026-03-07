'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { TreePine } from 'lucide-react'
import { motion } from 'framer-motion'
import { GamePreferencesModal } from '../components/GamePreferencesModal'
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
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [commonSettings, setCommonSettings] = useState<CommonSettings | null>(null)
  const [showGamePreferencesModal, setShowGamePreferencesModal] = useState(false)
  
  // Game players modal state
  const [showGamePlayersModal, setShowGamePlayersModal] = useState(false)
  const [selectedGame, setSelectedGame] = useState<string | null>(null)
  const [gamePlayers, setGamePlayers] = useState<Player[]>([])
  const [loadingPlayers] = useState(false)

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

  const handleGamePreferencesSaved = () => {
    // Refresh after saving preferences
  }

  const handleGamePreferencesSkipped = () => {
    // Just close modal, statistics remain unchanged
  }

  const closeGamePlayersModal = () => {
    setShowGamePlayersModal(false)
    setSelectedGame(null)
    setGamePlayers([])
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  const fetchData = async (): Promise<void> => {
    try {
      setError(null)
      const [feedRes, commonRes, eliteRes] = await Promise.all([
        axios.get<FeedItem[]>(`${API_URL}/api/feed`),
        axios.get<CommonSettings>(`${API_URL}/api/settings/common`),
        axios.get<Player[]>(`${API_URL}/api/discord/elite`),
      ])
      setFeed(feedRes.data)
      setCommonSettings(commonRes.data)
      setElitePlayers(eliteRes.data)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError('Не удалось загрузить данные')
      setElitePlayers([])
    }
  }

  const posts = feed.filter((item) => item.kind === 'post')

  return (
    <>
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
            <span>LESNAYA KOMANDA</span>
          </a>
          <div className="nav-links">
            <a href="/" className="nav-link">Главная</a>
            <a href="/streams" className="nav-link">Стримеры</a>
            <a href="/social" className="nav-link">Команда</a>
            <a href="/merch" className="nav-link">Магазин</a>
            {token ? (
              <>
                <a href="/profile" className="nav-link">ПРОФИЛЬ</a>
                <button type="button" onClick={handleLogout} className="lunacy-button" style={{ padding: '0.75rem 1.5rem' }}>
                  ВЫЙТИ
                </button>
              </>
            ) : (
              <a href={`${API_URL}/api/auth/discord`} className="lunacy-button" style={{ padding: '0.75rem 1.5rem' }}>
                ВОЙТИ
              </a>
            )}
          </div>
        </div>
      </nav>

      <main className="container">
        {error && <p style={{ color: '#ff6b6b', marginBottom: '1rem' }}>{error}</p>}
        
        {/* Hero секция */}
        <div className="hero-section" style={{
          minHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          position: 'relative',
          marginBottom: '4rem'
        }}>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ maxWidth: '800px' }}
          >
            <h1 style={{ 
              fontSize: 'clamp(3rem, 10vw, 6rem)',
              marginBottom: '2rem',
              background: 'linear-gradient(135deg, #4aff75 0%, #2d5a2d 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>
              LESNAYA
            </h1>
            <p style={{ 
              fontSize: '1.5rem', 
              color: '#888', 
              marginBottom: '3rem',
              fontFamily: 'Inter'
            }}>
              Добро пожаловать в цифровой лес
            </p>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <a
                href={commonSettings?.discord_join_url || '#'}
                target="_blank"
                rel="noreferrer"
                className="lunacy-button"
                style={{ fontSize: '1.1rem', padding: '1.25rem 3rem' }}
              >
                СМОТРЕТЬ СТРИМ
              </a>
              <a
                href={commonSettings?.discord_join_url || '#'}
                target="_blank"
                rel="noreferrer"
                className="lunacy-button"
                style={{ fontSize: '1.1rem', padding: '1.25rem 3rem' }}
              >
                ВСТУПИТЬ TELEGRAM
              </a>
            </div>
          </motion.div>
        </div>

        {/* Стримеры лесной команды */}
        <section id="streamers" style={{ marginTop: '6rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>СТРИМЕРЫ ЛЕСНОЙ КОМАНДЫ</h2>
          <div className="players-grid">
            {elitePlayers.filter(p => p.is_online).slice(0, 3).map((player, index) => (
              <a 
                key={player.discord_id ?? index} 
                href={`/profile/${player.discord_id}`}
                className="player-card"
                style={{ 
                  textDecoration: 'none', 
                  color: 'inherit', 
                  cursor: 'pointer',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  padding: '2rem'
                }}
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div style={{ position: 'relative', marginBottom: '1rem' }}>
                    {player.avatar_url ? (
                      <img
                        src={player.avatar_url}
                        alt={player.discord_username}
                        style={{ 
                          width: '120px', 
                          height: '120px', 
                          objectFit: 'cover', 
                          borderRadius: '50%',
                          border: '3px solid var(--accent)'
                        }}
                      />
                    ) : (
                      <div style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        background: 'var(--accent-dark)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '3rem',
                        color: 'var(--accent)',
                        border: '3px solid var(--accent)'
                      }}>
                        {player.discord_username?.[0] || '🐺'}
                      </div>
                    )}
                    {player.is_online && (
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '5px',
                          right: '5px',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          backgroundColor: '#4aff75',
                          border: '3px solid var(--gray)',
                        }}
                      />
                    )}
                  </div>
                  <div className="player-name" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                    {player.discord_username}
                  </div>
                  <div className="player-rank" style={{ marginBottom: '0.5rem' }}>
                    {player.forest_rank}
                  </div>
                  {player.is_online && (
                    <div style={{ fontSize: '0.875rem', color: '#4aff75' }}>
                      ● online
                    </div>
                  )}
                  <button className="lunacy-button" style={{ marginTop: '1rem', padding: '0.75rem 2rem' }}>
                    СМОТРЕТЬ СТРИМ
                  </button>
                </motion.div>
              </a>
            ))}
            
            {elitePlayers.filter(p => p.is_online).length === 0 && (
              <div className="game-card" style={{ background: 'var(--gray)', gridColumn: '1 / -1', textAlign: 'center', padding: '3rem' }}>
                <div className="game-name" style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>
                  💤
                </div>
                <div className="game-players" style={{ fontSize: '1.2rem' }}>
                  Тише Боссы спят....
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Мерч команды -> НОВОСТИ */}
        <section id="news" style={{ marginTop: '6rem' }}>
          <h2 style={{ textAlign: 'center', marginBottom: '3rem' }}>НОВОСТИ</h2>
          <div className="games-grid">
            {posts.slice(0, 3).map((item, index) => {
              const dateLabel = new Date(item.created_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div key={item.id} className="game-card" style={{ 
                  background: 'var(--gray)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center'
                }}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    style={{ width: '100%' }}
                  >
                    <div style={{ marginBottom: '1rem', color: '#666', fontSize: '0.75rem' }}>
                      {dateLabel}
                    </div>
                    <div className="game-name" style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>
                      {item.title}
                    </div>
                    {item.content && (
                      <div className="game-players" style={{ whiteSpace: 'pre-line', marginBottom: '1.5rem' }}>
                        {item.content}
                      </div>
                    )}
                    <button className="lunacy-button" style={{ padding: '0.75rem 2rem' }}>
                      КУПИТЬ
                    </button>
                  </motion.div>
                </div>
              )
            })}

            {posts.length === 0 && (
              <>
                <div className="game-card" style={{ background: 'var(--gray)', textAlign: 'center' }}>
                  <div className="game-name" style={{ marginBottom: '1rem' }}>ХУДИ LESNAYA</div>
                  <div className="game-players" style={{ marginBottom: '1.5rem' }}>4 500 ₽</div>
                  <button className="lunacy-button" style={{ padding: '0.75rem 2rem' }}>КУПИТЬ</button>
                </div>
                <div className="game-card" style={{ background: 'var(--gray)', textAlign: 'center' }}>
                  <div className="game-name" style={{ marginBottom: '1rem' }}>ФУТБОЛКА CYBER FOREST</div>
                  <div className="game-players" style={{ marginBottom: '1.5rem' }}>2 500 ₽</div>
                  <button className="lunacy-button" style={{ padding: '0.75rem 2rem' }}>КУПИТЬ</button>
                </div>
                <div className="game-card" style={{ background: 'var(--gray)', textAlign: 'center' }}>
                  <div className="game-name" style={{ marginBottom: '1rem' }}>КРУЖКА DRUID MODE</div>
                  <div className="game-players" style={{ marginBottom: '1.5rem' }}>1 000 ₽</div>
                  <button className="lunacy-button" style={{ padding: '0.75rem 2rem' }}>КУПИТЬ</button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Game Players Modal */}
        {showGamePlayersModal && (
          <div 
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0, 0, 0, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 1000,
              padding: '1rem'
            }}
            onClick={closeGamePlayersModal}
          >
            <div 
              style={{
                background: 'var(--gray)',
                border: '2px solid var(--accent)',
                borderRadius: '8px',
                padding: '2rem',
                maxWidth: '800px',
                width: '100%',
                maxHeight: '80vh',
                overflow: 'auto'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 style={{ 
                fontFamily: 'Unbounded', 
                marginBottom: '1rem',
                color: 'var(--accent)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between'
              }}>
                <span>ИГРОКИ В {selectedGame}</span>
                <button
                  onClick={closeGamePlayersModal}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#666',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    padding: '0.5rem'
                  }}
                >
                  ✕
                </button>
              </h2>

              {loadingPlayers ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                  Загрузка...
                </div>
              ) : gamePlayers.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem' }}>
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎮</div>
                  <div style={{ color: '#666' }}>
                    Пока никто не играет в {selectedGame}
                  </div>
                </div>
              ) : (
                <div style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '1rem' 
                }}>
                  {gamePlayers.map((player) => (
                    <a
                      key={player.discord_id}
                      href={`/profile/${player.discord_id}`}
                      style={{
                        textDecoration: 'none',
                        color: 'inherit',
                        background: 'var(--gray-light)',
                        padding: '1rem',
                        borderRadius: '8px',
                        border: '1px solid transparent',
                        transition: 'all 0.2s',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = 'var(--accent)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = 'transparent'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      {player.avatar_url ? (
                        <img
                          src={player.avatar_url}
                          alt={player.discord_username}
                          style={{
                            width: '60px',
                            height: '60px',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }}
                        />
                      ) : (
                        <div style={{
                          width: '60px',
                          height: '60px',
                          borderRadius: '50%',
                          background: 'var(--accent-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.5rem',
                          color: 'var(--accent)'
                        }}>
                          {player.discord_username[0]}
                        </div>
                      )}
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                          {player.discord_username}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>
                          {player.forest_rank}
                        </div>
                        {player.is_online && (
                          <div style={{ 
                            fontSize: '0.75rem', 
                            color: 'var(--accent)', 
                            marginTop: '0.25rem' 
                          }}>
                            ● Онлайн
                          </div>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Футер */}
        <footer className="footer">
          <p>© 2026 ЛЕСНАЯ КОМАНДА. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</p>
          <p style={{ marginTop: '0.5rem' }}>СДЕЛАНО С 🌲 В ЛЕСУ</p>
        </footer>
      </main>
    </>
  )
}
