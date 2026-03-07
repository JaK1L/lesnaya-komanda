'use client'

import { ExternalLink } from 'lucide-react'
import styles from './SocialCard.module.css'

interface SocialCardProps {
  name: string
  description: string
  url: string
  icon: string
  followers?: string | undefined
  color: string
  index: number
}

export function SocialCard({ 
  name, 
  description, 
  url, 
  icon, 
  followers, 
  color,
  index 
}: SocialCardProps) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.card}
      style={{ 
        borderTopColor: color,
        animationDelay: `${index * 0.1}s`
      }}
    >
      <div className={styles.iconWrapper} style={{ backgroundColor: color }}>
        <span className={styles.icon}>{icon}</span>
      </div>
      
      <div className={styles.content}>
        <h3 className={styles.name}>{name}</h3>
        <p className={styles.description}>{description}</p>
        
        {followers && (
          <div className={styles.followers}>
            <span className={styles.followersCount} style={{ color }}>{followers}</span>
            <span className={styles.followersLabel}>подписчиков</span>
          </div>
        )}
      </div>
      
      <div className={styles.linkIcon} style={{ color }}>
        <ExternalLink size={20} />
      </div>
    </a>
  )
}
