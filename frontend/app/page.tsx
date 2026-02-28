'use client'
// Vercel build: no unused imports
import { useEffect, useState } from 'react'
import axios from 'axios'
import { Gamepad2, TreePine, Sword, Target, Shield, ChevronRight } from 'lucide-react'
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
      const [playersRes, statsRes] = await Promise.all([
        axios.get<Player[]>(`${API_URL}/api/players?limit=6`),
        axios.get<Stats>(`${API_URL}/api/stats`),
      ])
      setPlayers(playersRes.data)
      setStats(statsRes.data)
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
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="hero-block"
        >
          <h1>ЛЕСНАЯ<br />КОМАНДА</h1>
          <p>
            Мы — своя стая. Играем в CS2, Dota 2, Valorant и всё, что под руку попадётся. 
            Без понтов, без маркетологов в пиджаках. Просто геймеры, которые нашли друг друга.
          </p>
          <a href="#" className="lunacy-button" style={{ marginTop: '2rem' }}>
            ВСТУПИТЬ В СТАЮ <ChevronRight size={16} style={{ marginLeft: '0.5rem', display: 'inline' }} />
          </a>
        </motion.div>

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

        {/* Игры */}
        <section id="games" style={{ marginTop: '6rem' }}>
          <h2>ВО ЧТО ИГРАЕМ</h2>
          <div className="games-grid">
            {games.map((game, index) => (
              <motion.div
                key={index}
                className="game-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <game.icon className="game-icon" size={32} style={{ color: game.color }} />
                <div className="game-name">{game.name}</div>
                <div className="game-players">{game.players} ИГРОКОВ</div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Игроки */}
        <section id="players" style={{ marginTop: '6rem' }}>
          <h2>АКТИВНЫЕ ВОЛКИ</h2>
          <div className="players-grid">
            {players.map((player: Player, index) => (
              <motion.div
                key={index}
                className="player-card"
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
            ))}
          </div>
        </section>

        {/* События в стиле Lunacy */}
        <section style={{ marginTop: '6rem' }}>
          <h2>СОБЫТИЯ В ЛЕСУ</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1px', background: 'var(--gray-light)', border: '1px solid var(--gray-light)' }}>
            {[
              { date: 'СЕГОДНЯ', time: '20:00', title: 'CS2 КЛАТЧ-ТУРНИР', desc: 'Собираем 5 команд для вечерних замесов' },
              { date: 'ЗАВТРА', time: '19:00', title: 'DOTA 2 ИНХАУС', desc: 'Играем 5х5, все уровни приветствуются' },
              { date: 'СБ', time: '15:00', title: 'VALORANT ТУРНИР', desc: 'Приз — звание "Лесной Ас"' },
            ].map((event, index) => (
              <div key={index} className="game-card" style={{ background: 'var(--gray)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span style={{ color: 'var(--accent)', fontFamily: 'Unbounded', fontWeight: 700, fontSize: '0.875rem' }}>{event.date}</span>
                  <span style={{ color: '#666' }}>{event.time}</span>
                </div>
                <div className="game-name" style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>{event.title}</div>
                <div className="game-players">{event.desc}</div>
              </div>
            ))}
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