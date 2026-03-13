'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import styles from './AchievementsSection.module.css'

interface UserAchievement {
  id: number
  name: string
  description: string | null
  icon: string
  category: string
  points: number
  progress: number
  max_progress: number
  is_completed: boolean
  earned_at: string | null
}

interface AchievementStats {
  total_achievements: number
  completed_achievements: number
  completion_percentage: number
  total_points: number
  by_category: Array<{
    category: string
    completed: number
    total: number
  }>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const getCategoryName = (category: string) => {
  const names: Record<string, string> = {
    activity: 'Активность',
    voice: 'Голосовые',
    events: 'События',
    games: 'Игры',
    special: 'Специальные',
    general: 'Общие',
  }
  return names[category] || category
}

export function AchievementsSection({ discordId }: { discordId: number }) {
  const [achievements, setAchievements] = useState<UserAchievement[]>([])
  const [stats, setStats] = useState<AchievementStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [showAll, setShowAll] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  useEffect(() => {
    loadAchievements()
  }, [discordId])

  const loadAchievements = async () => {
    try {
      setLoading(true)
      setFetchError(null)

      const [achievementsResponse, statsResponse] = await Promise.all([
        axios.get(`${API_URL}/api/achievements/user/${discordId}`),
        axios.get(`${API_URL}/api/achievements/user/${discordId}/stats`),
      ])
      setAchievements(achievementsResponse.data)
      setStats(statsResponse.data)
    } catch (err) {
      console.error('Error loading achievements:', err)
      if (axios.isAxiosError(err)) {
        setFetchError(err.response?.data?.detail || `Ошибка ${err.response?.status || 'сети'}`)
      } else {
        setFetchError('Не удалось загрузить достижения')
      }
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>🏆 ДОСТИЖЕНИЯ</h3>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>🏆 ДОСТИЖЕНИЯ</h3>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>⚠️</div>
          <div>Ошибка загрузки достижений</div>
          <div className={styles.emptyHint}>{fetchError}</div>
          <button onClick={loadAchievements} style={{ marginTop: '0.75rem', padding: '0.4rem 1rem', background: 'var(--color-purple)', border: 'none', borderRadius: '6px', color: '#fff', cursor: 'pointer', fontSize: '0.8rem' }}>
            Повторить
          </button>
        </div>
      </div>
    )
  }

  const completedAchievements = achievements.filter(a => a.is_completed)
  const displayedAchievements = showAll ? completedAchievements : completedAchievements.slice(0, 6)

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🏆 ДОСТИЖЕНИЯ</h3>

      {stats && (
        <div className={styles.stats}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.completed_achievements}</div>
            <div className={styles.statLabel}>Получено</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.total_points}</div>
            <div className={styles.statLabel}>Очков</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{stats.completion_percentage}%</div>
            <div className={styles.statLabel}>Прогресс</div>
          </div>
        </div>
      )}

      {completedAchievements.length === 0 ? (
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎯</div>
          <div>Пока нет достижений</div>
          <div className={styles.emptyHint}>Участвуйте в жизни сообщества, чтобы получить первое достижение!</div>
        </div>
      ) : (
        <>
          <div className={styles.grid}>
            {displayedAchievements.map((achievement) => (
              <div key={achievement.id} className={styles.achievementCard}>
                <div className={styles.achievementIcon}>{achievement.icon}</div>
                <div className={styles.achievementInfo}>
                  <div className={styles.achievementName}>{achievement.name}</div>
                  <div className={styles.achievementDescription}>
                    {achievement.description}
                  </div>
                  <div className={styles.achievementMeta}>
                    <span className={styles.category}>
                      {getCategoryName(achievement.category)}
                    </span>
                    <span className={styles.points}>{achievement.points} очков</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {completedAchievements.length > 6 && (
            <button
              onClick={() => setShowAll(!showAll)}
              className={styles.showMoreButton}
            >
              {showAll ? 'Показать меньше' : `Показать все (${completedAchievements.length})`}
            </button>
          )}
        </>
      )}
    </div>
  )
}
