'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import styles from './GameStatsSection.module.css'

interface GameStats {
  steam?: {
    profile: any
    cs2_stats: any
  }
  dota2?: {
    profile: any
    stats: any
  }
  valorant?: {
    profile: any
    mmr: any
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function GameStatsSection({ userId }: { userId: number }) {
  const [stats, setStats] = useState<GameStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadStats()
  }, [userId])

  const loadStats = async () => {
    try {
      setLoading(true)
      const response = await axios.get(`${API_URL}/api/game-stats/user/${userId}/stats`)
      setStats(response.data)
    } catch (err) {
      console.error('Error loading game stats:', err)
      setError('Не удалось загрузить статистику')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>🎮 Игровая статистика</h3>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    )
  }

  if (error || !stats || Object.keys(stats).length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>🎮 Игровая статистика</h3>
        <div className={styles.empty}>
          <div className={styles.emptyIcon}>🎯</div>
          <div>Игровые аккаунты не привязаны</div>
          <div className={styles.emptyHint}>Привяжите Steam, Dota 2 или Valorant для отображения статистики</div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>🎮 Игровая статистика</h3>

      <div className={styles.games}>
        {/* CS2 Stats */}
        {stats.steam?.cs2_stats && (
          <div className={styles.gameCard}>
            <div className={styles.gameHeader}>
              <h4>Counter-Strike 2</h4>
              {stats.steam.profile && (
                <a
                  href={stats.steam.profile.profile_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.profileLink}
                >
                  Steam Profile →
                </a>
              )}
            </div>
            <div className={styles.statsGrid}>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.steam.cs2_stats.kills}</div>
                <div className={styles.statLabel}>Убийств</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.steam.cs2_stats.deaths}</div>
                <div className={styles.statLabel}>Смертей</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.steam.cs2_stats.kd_ratio}</div>
                <div className={styles.statLabel}>K/D</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.steam.cs2_stats.wins}</div>
                <div className={styles.statLabel}>Побед</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.steam.cs2_stats.mvps}</div>
                <div className={styles.statLabel}>MVP</div>
              </div>
              <div className={styles.statItem}>
                <div className={styles.statValue}>{stats.steam.cs2_stats.accuracy}%</div>
                <div className={styles.statLabel}>Точность</div>
              </div>
            </div>
          </div>
        )}

        {/* Dota 2 Stats */}
        {stats.dota2 && (
          <div className={styles.gameCard}>
            <div className={styles.gameHeader}>
              <h4>Dota 2</h4>
              {stats.dota2.profile && (
                <div className={styles.profileInfo}>
                  {stats.dota2.profile.rank_tier && (
                    <span className={styles.rank}>Ранг: {stats.dota2.profile.rank_tier}</span>
                  )}
                  {stats.dota2.profile.mmr_estimate && (
                    <span className={styles.mmr}>MMR: ~{stats.dota2.profile.mmr_estimate}</span>
                  )}
                </div>
              )}
            </div>
            {stats.dota2.stats && (
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats.dota2.stats.wins}</div>
                  <div className={styles.statLabel}>Побед</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats.dota2.stats.losses}</div>
                  <div className={styles.statLabel}>Поражений</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats.dota2.stats.total_matches}</div>
                  <div className={styles.statLabel}>Матчей</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats.dota2.stats.win_rate}%</div>
                  <div className={styles.statLabel}>Винрейт</div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Valorant Stats */}
        {stats.valorant && (
          <div className={styles.gameCard}>
            <div className={styles.gameHeader}>
              <h4>Valorant</h4>
              {stats.valorant.profile && (
                <div className={styles.profileInfo}>
                  <span className={styles.username}>
                    {stats.valorant.profile.username}
                  </span>
                  <span className={styles.level}>
                    Уровень {stats.valorant.profile.account_level}
                  </span>
                </div>
              )}
            </div>
            {stats.valorant.mmr && (
              <div className={styles.statsGrid}>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats.valorant.mmr.current_tier || 'Unranked'}</div>
                  <div className={styles.statLabel}>Ранг</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>{stats.valorant.mmr.elo || 0}</div>
                  <div className={styles.statLabel}>ELO</div>
                </div>
                <div className={styles.statItem}>
                  <div className={styles.statValue}>
                    {stats.valorant.mmr.mmr_change > 0 ? '+' : ''}
                    {stats.valorant.mmr.mmr_change || 0}
                  </div>
                  <div className={styles.statLabel}>Последний матч</div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
