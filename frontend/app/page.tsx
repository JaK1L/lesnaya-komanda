'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Navigation, Footer } from '../components/layout'
import { HeroSection, StreamersSection, NewsSection } from '../components/home'
import { GamePreferencesModal } from '../components/GamePreferencesModal'
import './mobile-styles.css'

// Types
interface Player {
  discord_username: string
  forest_rank: string
  rating: number
  discord_id: number
  avatar_url?: string | null
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

// Constants
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

export default function Home() {
  // State
  const [elitePlayers, setElitePlayers] = useState<Player[]>([])
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [commonSettings, setCommonSettings] = useState<CommonSettings | null>(null)
  const [showGamePreferencesModal, setShowGamePreferencesModal] = useState(false)

  // Auth: проверка токена из URL после Discord OAuth
  useEffect(() => {
    if (typeof window === 'undefined') return

    const params = new URLSearchParams(window.location.search)
    const t = params.get('token')
    const login = params.get('login')

    if (t && login === 'discord') {
      localStorage.setItem(TOKEN_KEY, t)
      setToken(t)
      window.history.replaceState({}, '', window.location.pathname)
      checkGamePreferences(t)
    } else {
      const storedToken = localStorage.getItem(TOKEN_KEY)
      setToken(storedToken)
      if (storedToken) {
        checkGamePreferences(storedToken)
      }
    }
  }, [])

  // Загрузка данных при монтировании
  useEffect(() => {
    fetchData()
  }, [])

  // Проверка заполнены ли игровые предпочтения
  const checkGamePreferences = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })

      if (response.data.game_preferences === null) {
        setShowGamePreferencesModal(true)
      }
    } catch (err) {
      console.error('Error checking game preferences:', err)
    }
  }

  // Загрузка данных с API
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

  // Handlers
  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }

  const handleGamePreferencesSaved = () => {
    // Можно обновить статистику игр если нужно
  }

  const handleGamePreferencesSkipped = () => {
    // Просто закрываем модалку
  }

  // Фильтруем посты
  const posts = feed.filter((item) => item.kind === 'post')

  return (
    <>
      {/* Модалка выбора игр */}
      <GamePreferencesModal
        isOpen={showGamePreferencesModal}
        onClose={() => setShowGamePreferencesModal(false)}
        onSave={handleGamePreferencesSaved}
        onSkip={handleGamePreferencesSkipped}
      />

      {/* Навигация */}
      <Navigation
        isAuthenticated={!!token}
        onLogout={handleLogout}
        apiUrl={API_URL}
      />

      {/* Основной контент */}
      <main className="container">
        {/* Сообщение об ошибке */}
        {error && (
          <div style={{
            background: '#ff4444',
            color: 'white',
            padding: '1rem',
            marginBottom: '2rem',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        {/* Hero секция */}
        <HeroSection
          discordUrl={commonSettings?.discord_join_url || '#'}
        />

        {/* Стримеры */}
        <StreamersSection players={elitePlayers} />

        {/* Новости */}
        <NewsSection posts={posts} />

        {/* Футер */}
        <Footer />
      </main>
    </>
  )
}
