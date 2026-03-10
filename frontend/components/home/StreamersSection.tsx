'use client'

import { memo } from 'react'
import styles from './StreamersSection.module.css'

interface Streamer {
  discord_id: number
  discord_username: string
  avatar_url?: string | null
  forest_rank: string
  is_online?: boolean
  game?: string
  twitch_username?: string
  viewer_count?: number
  stream_title?: string
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
    <div className={styles.card}>
      <div className={styles.avatarWrapper}>
        {streamer.is_online && (
          <div className={styles.liveIndicator}>
            <span className={styles.liveDot}></span>
            LIVE
          </div>
        )}
        {streamer.avatar_url ? (
          <img
            src={streamer.avatar_url}
            alt={`${streamer.discord_username} avatar`}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarPlaceholder}>
            {streamer.discord_username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>

      <h3 className={styles.name}>{streamer.discord_username}</h3>
      
      {streamer.is_online && streamer.game ? (
        <p className={styles.game}>
          🎮 {streamer.game}
          {streamer.viewer_count && streamer.viewer_count > 0 && (
            <span className={styles.viewers}> • 👁 {streamer.viewer_count}</span>
          )}
        </p>
      ) : (
        <p className={styles.game}>{streamer.forest_rank}</p>
      )}
      
      <a 
        href={streamer.is_online && streamer.twitch_username 
          ? `https://twitch.tv/${streamer.twitch_username}` 
          : `/profile/${streamer.discord_id}`}
        target={streamer.is_online && streamer.twitch_username ? '_blank' : '_self'}
        rel={streamer.is_online && streamer.twitch_username ? 'noopener noreferrer' : undefined}
        className={styles.button}
      >
        {streamer.is_online ? 'Смотреть' : 'Профиль'}
      </a>
    </div>
  )
})

export const StreamersSection = memo(function StreamersSection({ streamers }: StreamersSectionProps) {
  const displayStreamers = streamers.slice(0, 6)

  return (
    <section className={styles.section} id="streamers">
      <h2 className={styles.title}>Стримеры</h2>
      
      {displayStreamers.length > 0 ? (
        <div className={styles.grid}>
          {displayStreamers.map((streamer) => (
            <StreamerCard 
              key={streamer.discord_id} 
              streamer={streamer}
            />
          ))}
        </div>
      ) : (
        <div className={styles.emptyState}>
          <p>Стримеры скоро появятся</p>
        </div>
      )}
    </section>
  )
})
