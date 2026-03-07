'use client'

import { Twitch, Youtube, ExternalLink } from 'lucide-react'
import styles from './StreamerCard.module.css'

interface StreamerCardProps {
  name: string
  game: string
  avatar: string
  platform: 'twitch' | 'youtube' | 'other'
  url: string
  isLive?: boolean
  viewers?: number | undefined
  schedule?: string | undefined
  index: number
}

export function StreamerCard({
  name,
  game,
  avatar,
  platform,
  url,
  isLive = false,
  viewers,
  schedule,
  index
}: StreamerCardProps) {
  const PlatformIcon = platform === 'twitch' ? Twitch : platform === 'youtube' ? Youtube : ExternalLink
  const platformColor = platform === 'twitch' ? '#9146FF' : platform === 'youtube' ? '#FF0000' : '#7cb342'

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div className={styles.avatarWrapper}>
        <img 
          src={avatar} 
          alt={name}
          className={styles.avatar}
        />
        {isLive && (
          <div className={styles.liveBadge}>
            <span className={styles.liveDot}></span>
            LIVE
          </div>
        )}
      </div>

      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.name}>{name}</h3>
          <div className={styles.platformIcon} style={{ color: platformColor }}>
            <PlatformIcon size={20} />
          </div>
        </div>

        <p className={styles.game}>{game}</p>

        {isLive && viewers !== undefined && (
          <div className={styles.viewers}>
            <span className={styles.viewersDot}></span>
            {viewers} зрителей
          </div>
        )}

        {!isLive && schedule && (
          <div className={styles.schedule}>
            📅 {schedule}
          </div>
        )}
      </div>

      <div className={styles.linkIcon}>
        <ExternalLink size={20} />
      </div>
    </a>
  )
}
