'use client'

import { useMemo, memo } from 'react'
import { motion } from 'framer-motion'
import { Button, OptimizedImage } from '../ui'
import styles from './StreamersSection.module.css'

interface Player {
  discord_username: string
  forest_rank: string
  discord_id: number
  avatar_url?: string | null
  is_online?: boolean
}

interface StreamersSectionProps {
  players: Player[]
}

// Анимация контейнера с stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

// Анимация карточки
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.9 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Мемоизированная карточка стримера
const StreamerCard = memo(function StreamerCard({ 
  player
}: { 
  player: Player
}) {
  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ 
        scale: 1.05,
        transition: { duration: 0.2 }
      }}
      whileTap={{ scale: 0.98 }}
    >
      <a
        href={`/profile/${player.discord_id}`}
        className={styles.streamerCard}
      >
        <div className={styles.avatarWrapper}>
          {player.avatar_url ? (
            <OptimizedImage
              src={player.avatar_url}
              alt={`${player.discord_username} avatar`}
              width={120}
              height={120}
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {player.discord_username?.[0] || '🐺'}
            </div>
          )}
          {player.is_online && (
            <motion.div 
              animate={{ 
                scale: [1, 1.2, 1],
                opacity: [1, 0.8, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            >
              <div className={styles.onlineIndicator} />
            </motion.div>
          )}
        </div>

        <div className={styles.name}>{player.discord_username}</div>
        <div className={styles.rank}>{player.forest_rank}</div>
        {player.is_online && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className={styles.status}>● online</div>
          </motion.div>
        )}

        <Button size="small">СМОТРЕТЬ СТРИМ</Button>
      </a>
    </motion.div>
  )
})

export const StreamersSection = memo(function StreamersSection({ players }: StreamersSectionProps) {
  // Мемоизируем фильтрацию онлайн игроков
  const onlinePlayers = useMemo(
    () => players.filter(p => p.is_online).slice(0, 3),
    [players]
  )

  return (
    <section id="streamers" className={styles.section}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className={styles.title}>СТРИМЕРЫ ЛЕСНОЙ КОМАНДЫ</h2>
      </motion.div>
      
      {onlinePlayers.length > 0 ? (
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
        >
          <div className={styles.grid}>
            {onlinePlayers.map((player) => (
              <StreamerCard 
                key={player.discord_id} 
                player={player}
              />
            ))}
          </div>
        </motion.div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className={styles.emptyState}>
            <motion.div 
              animate={{ 
                rotate: [0, -10, 10, -10, 0],
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              <div className={styles.emptyIcon}>💤</div>
            </motion.div>
            <div className={styles.emptyText}>Тише Боссы спят....</div>
          </div>
        </motion.div>
      )}
    </section>
  )
})
