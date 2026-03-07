'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Navigation, Footer, SkipToContent } from '../../components/layout'
import { StreamerCard } from '../../components/streamers'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Streamer {
  id: number
  name: string
  game: string | null
  avatar_url: string | null
  platform: 'twitch' | 'youtube' | 'other'
  stream_url: string
  schedule: string | null
}

export default function StreamsPage() {
  const [streamers, setStreamers] = useState<Streamer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchStreamers()
  }, [])

  const fetchStreamers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<Streamer[]>(`${API_URL}/api/streamers`)
      setStreamers(response.data)
    } catch (err) {
      console.error('Error fetching streamers:', err)
      setError('Не удалось загрузить стримеров')
    } finally {
      setLoading(false)
    }
  }

  // Для демонстрации - в будущем можно добавить реальную проверку статуса стрима
  const liveStreamers = streamers.filter((_, index) => index === 0) // Первый стример "в эфире" для демо
  const offlineStreamers = streamers.filter((_, index) => index !== 0)

  if (loading) {
    return (
      <>
        <SkipToContent />
        <Navigation
          apiUrl={API_URL}
          isAuthenticated={false}
          onLogout={() => {}}
        />
        <main className="container" id="main-content" tabIndex={-1}>
          <div className={styles.loading}>Загрузка стримеров...</div>
          <Footer />
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <SkipToContent />
        <Navigation
          apiUrl={API_URL}
          isAuthenticated={false}
          onLogout={() => {}}
        />
        <main className="container" id="main-content" tabIndex={-1}>
          <div className={styles.error}>{error}</div>
          <Footer />
        </main>
      </>
    )
  }

  return (
    <>
      <SkipToContent />
      <Navigation
        apiUrl={API_URL}
        isAuthenticated={false}
        onLogout={() => {}}
      />
      
      <main className="container" id="main-content" tabIndex={-1}>
        <div className={styles.hero}>
          <h1 className={styles.title}>СТРИМЫ</h1>
          <p className={styles.subtitle}>
            Смотри прямые трансляции от участников команды. Учись, общайся, поддерживай!
          </p>
        </div>

        {liveStreamers.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.liveDot}></span>
                Сейчас в эфире
              </h2>
              <span className={styles.liveCount}>{liveStreamers.length} стрим(ов)</span>
            </div>
            <div className={styles.streamersGrid}>
              {liveStreamers.map((streamer, index) => (
                <StreamerCard
                  key={streamer.id}
                  name={streamer.name}
                  game={streamer.game || 'Разные игры'}
                  avatar={streamer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer.name}`}
                  platform={streamer.platform}
                  url={streamer.stream_url}
                  isLive={true}
                  viewers={Math.floor(Math.random() * 500) + 50} // Демо данные
                  schedule={streamer.schedule || undefined}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        {streamers.length === 0 ? (
          <section className={styles.section}>
            <div className={styles.empty}>
              <p>Стримеров пока нет</p>
            </div>
          </section>
        ) : (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Все стримеры</h2>
              <span className={styles.count}>{offlineStreamers.length} стримеров</span>
            </div>
            <div className={styles.streamersGrid}>
              {offlineStreamers.map((streamer, index) => (
                <StreamerCard
                  key={streamer.id}
                  name={streamer.name}
                  game={streamer.game || 'Разные игры'}
                  avatar={streamer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer.name}`}
                  platform={streamer.platform}
                  url={streamer.stream_url}
                  isLive={false}
                  viewers={undefined}
                  schedule={streamer.schedule || undefined}
                  index={index + liveStreamers.length}
                />
              ))}
            </div>
          </section>
        )}

        <section className={styles.cta}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Хочешь стать стримером команды?</h2>
            <p className={styles.ctaText}>
              Если ты активный участник сообщества и хочешь стримить от имени Лесной Команды, напиши нам в Discord!
            </p>
            <a 
              href="https://discord.gg/YgX4RQZ" 
              className={styles.ctaButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Написать в Discord
            </a>
          </div>
        </section>
        
        <Footer />
      </main>
    </>
  )
}
