'use client'

import { memo } from 'react'
import Link from 'next/link'
import { Twitch, Users, Eye } from 'lucide-react'
import styles from './StreamersSection.module.css'

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

interface StreamersSectionProps {
  streamers: Streamer[]
}

const StreamerCard = memo(function StreamerCard({ 
  streamer
}: { 
  streamer: Streamer
}) {
  return (
    <a
      href={streamer.stream_url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
    >
      {/* Превью стрима или аватар */}
      <div className={styles.cardImage}>
        {streamer.is_live && streamer.thumbnail_url ? (
          <img 
            src={streamer.thumbnail_url} 
            alt={`${streamer.display_name} stream`}
            className={styles.thumbnail}
          />
        ) : (
          <div className={styles.avatarContainer}>
            <img 
              src={streamer.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${streamer.twitch_username}`} 
              alt={streamer.display_name}
              className={styles.avatar}
            />
          </div>
        )}
        
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
            <div className={styles.nameContainer}>
              <h3 className={styles.streamerName}>{streamer.display_name}</h3>
              <p className={styles.streamerUsername}>@{streamer.twitch_username}</p>
            </div>
          </div>
          <Twitch size={20} className={styles.twitchIcon} />
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
              <Eye size={14} />
              <span>{streamer.viewer_count.toLocaleString()}</span>
            </div>
          )}
          <div className={styles.stat}>
            <Users size={14} />
            <span>{streamer.followers_count.toLocaleString()}</span>
          </div>
        </div>
      </div>
    </a>
  )
})

export const StreamersSection = memo(function StreamersSection({ streamers }: StreamersSectionProps) {
  // Показываем сначала онлайн стримеров, потом оффлайн
  const liveStreamers = streamers.filter(s => s.is_live)
  const offlineStreamers = streamers.filter(s => !s.is_live)
  const displayStreamers = [...liveStreamers, ...offlineStreamers].slice(0, 6)

  return (
    <section className={styles.section} id="streams">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Стримеры</h2>
        <p className={styles.sectionSubtitle}>
          Наблюдайте за игроками лесной команды
          {liveStreamers.length > 0 && (
            <span className={styles.liveIndicator}>
              <span className={styles.liveDot}></span>
              {liveStreamers.length} в эфире
            </span>
          )}
        </p>
      </div>

      <div className={styles.grid}>
        {displayStreamers.length > 0 ? (
          displayStreamers.map((streamer) => (
            <StreamerCard 
              key={streamer.id} 
              streamer={streamer}
            />
          ))
        ) : (
          <div className={styles.empty}>
            <Twitch size={48} style={{ opacity: 0.3 }} />
            <p>Стримеры скоро появятся</p>
          </div>
        )}
      </div>

      {displayStreamers.length > 0 && (
        <Link href="/streams" className={styles.showAllBtn}>
          Смотреть всех стримеров
        </Link>
      )}
    </section>
  )
})
