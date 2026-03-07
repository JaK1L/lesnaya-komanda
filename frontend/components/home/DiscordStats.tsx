'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import styles from './DiscordStats.module.css'

interface EliteUser {
  discord_id: number
  discord_username: string
  avatar_url: string
  forest_rank: string
  rating: number
  status: string
  is_online: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function DiscordStats() {
  const [eliteUsers, setEliteUsers] = useState<EliteUser[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEliteUsers()
    // Обновляем каждые 30 секунд
    const interval = setInterval(fetchEliteUsers, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchEliteUsers = async () => {
    try {
      setError(null)
      const response = await axios.get<EliteUser[]>(`${API_URL}/api/discord/elite`)
      setEliteUsers(response.data)
    } catch (err) {
      console.error('Error fetching elite users:', err)
      setError('Не удалось загрузить данные Discord')
    } finally {
      setLoading(false)
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'online':
        return styles.statusOnline
      case 'idle':
        return styles.statusIdle
      case 'dnd':
        return styles.statusDnd
      default:
        return styles.statusOffline
    }
  }

  const onlineCount = eliteUsers.filter(u => u.is_online).length
  const totalCount = eliteUsers.length

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка данных Discord...</div>
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.error}>{error}</div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <h2 className={styles.title}>
            🎮 Discord Сервер
          </h2>
          <p className={styles.subtitle}>Элита леса и статистика сервера</p>
        </header>

        <div className={styles.content}>
          {/* Элита леса */}
          <div className={styles.eliteSection}>
            <h3 className={styles.sectionTitle}>
              👑 Элита Леса
            </h3>
            {eliteUsers.length === 0 ? (
              <div className={styles.empty}>
                <p>Элита отдыхает</p>
              </div>
            ) : (
              <div className={styles.eliteGrid}>
                {eliteUsers.map((user) => (
                  <div key={user.discord_id} className={styles.eliteCard}>
                    <div className={styles.avatarContainer}>
                      <img
                        src={user.avatar_url}
                        alt={user.discord_username}
                        className={styles.avatar}
                      />
                      <div className={`${styles.statusIndicator} ${getStatusClass(user.status)}`} />
                    </div>
                    <p className={styles.username}>{user.discord_username}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Статистика */}
          <div className={styles.statsSection}>
            <h3 className={styles.sectionTitle}>
              📊 Статистика
            </h3>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🟢</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Онлайн сейчас</p>
                <p className={styles.statValue}>{onlineCount}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Всего элиты</p>
                <p className={styles.statValue}>{totalCount}</p>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>⚡</div>
              <div className={styles.statInfo}>
                <p className={styles.statLabel}>Активность</p>
                <p className={styles.statValue}>
                  {totalCount > 0 ? Math.round((onlineCount / totalCount) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
