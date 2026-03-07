'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import axios from 'axios'
import { Navigation, Footer, SkipToContent } from '../components/layout'
import { HeroSection, StreamersSection, NewsSection } from '../components/home'
import { StreamersSkeleton } from '../components/home/StreamersSkeleton'
import { NewsSkeleton } from '../components/home/NewsSkeleton'
import { ErrorMessage } from '../components/ui'
import { lazyLoadModal } from '../lib/lazyLoad'
import './mobile-styles.css'

// Dynamic imports для модалок (lazy loading)
const GamePreferencesModal = lazyLoadModal(
  () => import('../components/GamePreferencesModal').then(mod => ({ default: mod.GamePreferencesModal }))
)

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
  const [loading, setLoading] = useState(true)
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

  // Проверка заполнены ли игровые предпочтения (мемоизирована)
  const checkGamePreferences = useCallback(async (authToken: string) => {
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
  }, [])

  // Загрузка данных с API (мемоизирована)
  const fetchData = useCallback(async (): Promise<void> => {
    try {
      setLoading(true)
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
      setError('Не удалось загрузить данные. Проверьте подключение к интернету.')
      setElitePlayers([])
    } finally {
      setLoading(false)
    }
  }, [])

  // Handlers (мемоизированы)
  const handleLogout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
  }, [])

  const handleGamePreferencesSaved = useCallback(() => {
    // Можно обновить статистику игр если нужно
  }, [])

  const handleGamePreferencesSkipped = useCallback(() => {
    // Просто закрываем модалку
  }, [])

  const handleRetry = useCallback(() => {
    fetchData()
  }, [fetchData])

  // Мемоизируем фильтрацию постов
  const posts = useMemo(
    () => feed.filter((item) => item.kind === 'post'),
    [feed]
  )

  return (
    <>
      {/* Skip to content для keyboard navigation */}
      <SkipToContent />

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
      <main id="main-content" className="container" tabIndex={-1}>
        {/* Hero секция */}
        <HeroSection
          discordUrl={commonSettings?.discord_join_url || '#'}
        />

        {/* Ошибка загрузки */}
        {error && !loading && (
          <ErrorMessage 
            message={error}
            onRetry={handleRetry}
          />
        )}

        {/* Стримеры */}
        {loading ? (
          <section id="streamers" style={{ marginTop: '6rem' }} aria-label="Загрузка стримеров">
            <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
              СТРИМЕРЫ ЛЕСНОЙ КОМАНДЫ
            </h2>
            <StreamersSkeleton />
          </section>
        ) : !error ? (
          <StreamersSection players={elitePlayers} />
        ) : null}

        {/* Новости */}
        {loading ? (
          <section id="news" style={{ marginTop: '6rem' }} aria-label="Загрузка новостей">
            <h2 style={{ textAlign: 'center', marginBottom: '3rem', fontSize: 'clamp(2rem, 5vw, 3rem)' }}>
              НОВОСТИ
            </h2>
            <NewsSkeleton />
          </section>
        ) : !error ? (
          <NewsSection posts={posts} />
        ) : null}

        {/* Футер */}
        <Footer />
      </main>
    </>
  )
}
