'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/Button/Button'
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

export function StreamersSection({ players }: StreamersSectionProps) {
  const onlinePlayers = players.filter(p => p.is_online).slice(0, 3)

  return (
    <section id="streamers" className={styles.section}>
      <h2 className={styles.title}>СТРИМЕРЫ ЛЕСНОЙ КОМАНДЫ</h2>
      
      <div className={styles.grid}>
        {onlinePlayers.length > 0 ? (
          onlinePlayers.map((player, index) => (
            <a
              key={player.discord_id}
              href={`/profile/${player.discord_id}`}
              className={styles.streamerCard}
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}
              >
                <div className={styles.avatarWrapper}>
                  {player.avatar_url ? (
                    <img
                      src={player.avatar_url}
                      alt={player.discord_username}
                      className={styles.avatar}
                    />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {player.discord_username?.[0] || '🐺'}
                    </div>
                  )}
                  {player.is_online && (
                    <div className={styles.onlineIndicator} />
                  )}
                </div>

                <div className={styles.name}>{player.discord_username}</div>
                <div className={styles.rank}>{player.forest_rank}</div>
                {player.is_online && (
                  <div className={styles.status}>● online</div>
                )}

                <Button size="small">СМОТРЕТЬ СТРИМ</Button>
              </motion.div>
            </a>
          ))
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>💤</div>
            <div className={styles.emptyText}>Тише Боссы спят....</div>
          </div>
        )}
      </div>
    </section>
  )
}
