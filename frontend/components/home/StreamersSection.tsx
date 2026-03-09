'use client'

import { memo } from 'react'
import { motion } from 'framer-motion'
import styles from './StreamersSection.module.css'

interface Streamer {
  discord_id: number
  discord_username: string
  avatar_url?: string | null
  forest_rank: string
  is_online?: boolean
  game?: string
}

interface StreamersSectionProps {
  streamers: Streamer[]
}

// Анимация контейнера с stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Анимация карточки
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Мемоизированная карточка стримера
const StreamerCard = memo(function StreamerCard({ 
  streamer
}: { 
  streamer: Streamer
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ 
        scale: 1.03,
        transition: { duration: 0.2 }
      }}
      className={styles.card}
    >
      <div className={styles.avatarWrapper}>
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
      <p className={styles.game}>{streamer.game || streamer.forest_rank}</p>
      
      <a 
        href={`/profile/${streamer.discord_id}`}
        className={styles.button}
      >
        Профиль
      </a>
    </motion.div>
  )
})

export const StreamersSection = memo(function StreamersSection({ streamers }: StreamersSectionProps) {
  // Показываем первых 3 стримеров или всех если меньше
  const displayStreamers = streamers.slice(0, 3)

  return (
    <section className={styles.section}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className={styles.title}>Стримеры</h2>
      </motion.div>
      
      {displayStreamers.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className={styles.grid}
        >
          {displayStreamers.map((streamer) => (
            <StreamerCard 
              key={streamer.discord_id} 
              streamer={streamer}
            />
          ))}
        </motion.div>
      ) : (
        <div className={styles.emptyState}>
          <p>Стримеры скоро появятся</p>
        </div>
      )}
    </section>
  )
})
