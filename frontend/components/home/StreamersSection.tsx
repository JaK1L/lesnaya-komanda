'use client'

import { memo } from 'react'
import Link from 'next/link'
import styles from './StreamersSection.module.css'

interface Streamer {
  id: number
  name: string
  game?: string | null
  avatar_url?: string | null
  platform: string
  stream_url: string
  is_active: boolean
  is_online?: boolean
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
  const href = streamer.is_online 
    ? streamer.stream_url 
    : streamer.stream_url
  
  const target = '_blank'
  const rel = 'noopener noreferrer'

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
            alt={streamer.name}
            className={styles.cardImg}
          />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            {streamer.name?.[0]?.toUpperCase() || '?'}
          </div>
        )}
      </div>
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>{streamer.name}</h3>
        <p className={styles.cardDescription}>
          {streamer.is_online && streamer.game 
            ? `🎮 ${streamer.game}${streamer.viewer_count ? ` • 👁 ${streamer.viewer_count}` : ''}`
            : streamer.game || 'Играет в различные компьютерные игры'}
        </p>
      </div>
    </a>
  )
})

export const StreamersSection = memo(function StreamersSection({ streamers }: StreamersSectionProps) {
  const displayStreamers = streamers.slice(0, 6)

  return (
    <section className={styles.section} id="streams">
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Стримеры</h2>
        <p className={styles.sectionSubtitle}>Наблюдайте за игроками лесной команды</p>
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
          <div style={{ 
            gridColumn: '1 / -1', 
            textAlign: 'center', 
            padding: '3rem 0',
            color: 'var(--color-white-64)' 
          }}>
            Стримеры скоро появятся
          </div>
        )}
      </div>

      {displayStreamers.length > 0 && (
        <Link href="/streams" className={styles.showAllBtn}>
          Смотреть полностью
        </Link>
      )}
    </section>
  )
})
