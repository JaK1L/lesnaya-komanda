'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Navigation, Footer, SkipToContent } from '../../components/layout'
import styles from './page.module.css'
import { Twitch, Users, Eye } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Streamer {
  id: number
  twitch_username: string
  display_name: string
  avatar_url: string | null
  description: string | null
  stream_url: string
  followers_count: number
  is_live: boolean
  game_name: string | null
  stream_title: string | null
  viewer_count: number
  thumbnail_url: string | null
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

  const liveStreamers = streamers.filter(s => s.is_live)
  const offlineStreamers = streamers.filter(s => !s.is_live)

  if (loading) {
    return (
      <>
        <SkipToContent />
        <Navigation
          apiUrl={API_URL}
          isAuthenticated={false}
          onLogout={() => {}}
        />
        <main id="main-content" tabIndex={-1}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Загрузка стримеров...</p>
          </div>
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
        <main id="main-content" tabIndex={-1}>
          <div className={styles.error}>
            <p>{error}</p>
            <button onClick={fetchStreamers} className={styles.retryButton}>
              Попробовать снова
            </button>
          </div>
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
      
      <main id="main-content" tabIndex={-1}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Стримы</h1>
          <p className={styles.subtitle}>
            Смотри прямые трансляции от участников команды
          </p>
        </div>

        {liveStreamers.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Сейчас в эфире</h2>
                <p className={styles.sectionSubtitle}>
                  <span className={styles.liveIndicator}>
                    <span className={styles.liveDot}></span>
                    {liveStreamers.length} {liveStreamers.length === 1 ? 'стример' : 'стримеров'}
                  </span>
                </p>
              </div>
            </div>
            <div className={styles.grid}>
              {liveStreamers.map((streamer) => (
                <StreamerCardNew key={streamer.id} streamer={streamer} />
              ))}
            </div>
          </section>
        )}

        {streamers.length === 0 ? (
          <section className={styles.section}>
            <div className={styles.empty}>
              <Twitch size={64} style={{ opacity: 0.3 }} />
              <p>Стримеров пока нет</p>
            </div>
          </section>
        ) : offlineStreamers.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <div>
                <h2 className={styles.sectionTitle}>Все стримеры</h2>
                <p className={styles.sectionSubtitle}>
                  {offlineStreamers.length} {offlineStreamers.length === 1 ? 'стример' : 'стримеров'}
                </p>
              </div>
            </div>
            <div className={styles.grid}>
              {offlineStreamers.map((streamer) => (
                <StreamerCardNew key={streamer.id} streamer={streamer} />
              ))}
            </div>
          </section>
        )}

        <section className={styles.cta}>
          <h2 className={styles.ctaTitle}>Хочешь стать стримером команды?</h2>
          <p className={styles.ctaText}>
            Если ты активный участник сообщества и хочешь стримить от имени Лесной Команды, напиши нам в Discord
          </p>
          <a 
            href="https://discord.gg/YgX4RQZ" 
            className={styles.ctaButton}
            target="_blank"
            rel="noopener noreferrer"
          >
            Написать в Discord
          </a>
        </section>
        
        <Footer />
      </main>
    </>
  )
}

function StreamerCardNew({ streamer }: { streamer: Streamer }) {
  return (
    <a
      href={streamer.stream_url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.streamerCard}
    >
      {/* Встроенный Twitch Player */}
      <div className={styles.cardImage}>
        <iframe
          src={`https://player.twitch.tv/?channel=${streamer.twitch_username}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}&muted=true`}
          height="100%"
          width="100%"
          allowFullScreen
          className={styles.twitchPlayer}
        />
        
        {streamer.is_live && (
          <div className={styles.liveBadge}>
            <span className={styles.liveDot}></span>
            LIVE
          </div>
        )}
      </div>

      {/* Информация о стримере */}
      <div className={styles.cardContent}>
        <div className={styles.cardHeader}>
          <div className={styles.streamerInfo}>
            {!streamer.is_live && streamer.avatar_url && (
              <img 
                src={streamer.avatar_url} 
                alt={streamer.display_name}
                className={styles.smallAvatar}
              />
            )}
            <div>
              <h3 className={styles.streamerName}>{streamer.display_name}</h3>
              <p className={styles.streamerUsername}>@{streamer.twitch_username}</p>
            </div>
          </div>
          <Twitch size={24} className={styles.twitchIcon} />
        </div>

        {/* Название стрима если онлайн */}
        {streamer.is_live && streamer.stream_title && (
          <p className={styles.streamTitle}>{streamer.stream_title}</p>
        )}

        {/* Описание если оффлайн */}
        {!streamer.is_live && streamer.description && (
          <p className={styles.description}>{streamer.description}</p>
        )}

        {/* Игра */}
        {streamer.game_name && (
          <div className={styles.game}>
            🎮 {streamer.game_name}
          </div>
        )}

        {/* Статистика */}
        <div className={styles.stats}>
          {streamer.is_live && (
            <div className={styles.stat}>
              <Eye size={16} />
              <span>{streamer.viewer_count.toLocaleString()} зрителей</span>
            </div>
          )}
          <div className={styles.stat}>
            <Users size={16} />
            <span>{streamer.followers_count.toLocaleString()} фолловеров</span>
          </div>
        </div>
      </div>
    </a>
  )
}
