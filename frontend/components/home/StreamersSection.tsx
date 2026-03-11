'use client'

import { memo } from 'react'
import Link from 'next/link'
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
  const href = streamer.is_online && streamer.twitch_username 
    ? `https://twitch.tv/${streamer.twitch_username}` 
    : `/profile/${streamer.discord_id}`
  
  const target = streamer.is_online && streamer.twitch_username ? '_blank' : '_self'
  const rel = streamer.is_online && streamer.twitch_username ? 'noopener noreferrer' : undefined

  return (
    <a
      href={href}
      target={target}
      rel={rel}
      className={styles.card}
    >
      <div className={styles.cardImage}>
        {streamer.avatar_url ? (
          <img
            src={streamer.avatar_url}
            alt={streamer.discord_username}
            className={styles.cardImg}
          />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            {streamer.discord_username?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{streamer.discord_username}</h3>
        <p className={styles.cardDescription}>
          {streamer.is_online && streamer.game 
            ? `🎮 ${streamer.game}${streamer.viewer_count ? ` • 👁 ${streamer.viewer_count}` : ''}`
            : streamer.forest_rank || 'Играет в различные компьютерные игры'}
        </p>
      </div>
    </a>
  )
})

export const StreamersSection = memo(function StreamersSection({ streamers }: StreamersSectionProps) {
  const displayStreamers = streamers.slice(0, 6)

  return (
    <section className={styles.section} id="streamers">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Стримеры</h2>
        <p className={styles.sectionSubtitle}>Наблюдайте за игроками лесной команды</p>
      </div>

      {displayStreamers.length > 0 ? (
        <>
          <div className={styles.grid}>
            {displayStreamers.map((streamer) => (
              <StreamerCard 
                key={streamer.discord_id} 
                streamer={streamer}
              />
            ))}
          </div>

          <Link href="/streams" className={styles.showAllBtn}>
            Смотреть полностью
          </Link>
        </>
      ) : (
        <p style={{ color: 'var(--color-white-64)' }}>Стримеры скоро появятся</p>
      )}
    </section>
  )
})
