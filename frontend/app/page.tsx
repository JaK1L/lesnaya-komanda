'use client'

import { useEffect, useState, useCallback } from 'react'
import axios from 'axios'
import { Navigation, Footer, SkipToContent } from '../components/layout'
import { HeroSection, NewsSection, StreamersSection } from '../components/home'
import { PageErrorBoundary } from '../components/PageErrorBoundary'
import { SectionErrorBoundary } from '../components/SectionErrorBoundary'
import { lazyLoadModal } from '../lib/lazyLoad'
import './mobile-styles.css'

// Dynamic imports для модалок (lazy loading)
const GamePreferencesModal = lazyLoadModal(
  () => import('../components/GamePreferencesModal').then(mod => ({ default: mod.GamePreferencesModal }))
)

// Types
interface CommonSettings {
  discord_join_url: string
  maintenance_enabled: boolean
  maintenance_message?: string | null
}

interface Streamer {
  discord_id: number
  discord_username: string
  avatar_url?: string | null
  forest_rank: string
  is_online?: boolean
  game?: string
}

// Constants
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

export default function Home() {
  // State
  const [token, setToken] = useState<string | null>(null)
  const [commonSettings, setCommonSettings] = useState<CommonSettings | null>(null)
  const [showGamePreferencesModal, setShowGamePreferencesModal] = useState(false)
  const [streamers, setStreamers] = useState<Streamer[]>([])

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
      const [commonRes, streamersRes] = await Promise.all([
        axios.get<CommonSettings>(`${API_URL}/api/settings/common`),
        axios.get<Streamer[]>(`${API_URL}/api/streamers`)
      ])
      
      setCommonSettings(commonRes.data)
      setStreamers(streamersRes.data || [])
    } catch (err) {
      console.error('Error fetching data:', err)
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

  return (
    <PageErrorBoundary pageName="Главная">
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
      <main id="main-content" tabIndex={-1}>
        {/* Hero секция */}
        <SectionErrorBoundary sectionName="Hero">
          <HeroSection />
        </SectionErrorBoundary>

        {/* Секция стримеров */}
        <SectionErrorBoundary sectionName="Стримеры">
          <StreamersSection streamers={streamers} />
        </SectionErrorBoundary>

        {/* Секция новостей */}
        <SectionErrorBoundary sectionName="Новости">
          <NewsSection />
        </SectionErrorBoundary>

        {/* Футер */}
        <Footer />
      </main>
    </PageErrorBoundary>
  )
}
