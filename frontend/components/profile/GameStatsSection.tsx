'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import styles from './GameStatsSection.module.css'

interface SteamProfile {
  steam_id: string
  username: string
  avatar_url: string
  profile_url: string
  status: string
  last_logoff: string | null
}

interface CS2Stats {
  kills: number
  deaths: number
  kd_ratio: number
  wins: number
  matches_played: number
  mvps: number
  headshots: number
  accuracy: number
}

interface Dota2Profile {
  account_id: string
  username: string
  avatar_url: string
  rank_tier: number | null
  leaderboard_rank: number | null
  mmr_estimate: number | null
}

interface Dota2Stats {
  wins: number
  losses: number
  total_matches: number
  win_rate: number
}

interface ValorantProfile {
  riot_id: string
  tag: string
  username: string
  account_level: number
  card_url: string
  region: string
}

interface ValorantMMR {
  current_tier: string
  ranking_in_tier: number
  mmr_change: number
  elo: number
  games_needed_for_rating: number
}

interface GameStats {
  steam?: {
    profile: SteamProfile
    cs2_stats: CS2Stats
  }
  dota2?: {
    profile: Dota2Profile
    stats: Dota2Stats
  }
  valorant?: {
    profile: ValorantProfile
    mmr: ValorantMMR
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function GameStatsSection({ userId, isOwnProfile = false }: { userId: number, isOwnProfile?: boolean }) {
  const [stats, setStats] = useState<GameStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [linkGame, setLinkGame] = useState<'steam' | 'dota2' | 'valorant' | null>(null)
  const [linkFormData, setLinkFormData] = useState({
    accountId: '',
    accountTag: '',
    region: 'eu'
  })

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

  const handleLinkAccount = (game: 'steam' | 'dota2' | 'valorant') => {
    setLinkGame(game)
    setLinkFormData({ accountId: '', accountTag: '', region: 'eu' })
    setShowLinkModal(true)
  }

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!linkGame) return

    const token = localStorage.getItem('lesnaya_token')
    if (!token) {
      alert('Необходимо войти в систему')
      return
    }

    try {
      await axios.post(
        `${API_URL}/api/game-stats/link`,
        {
          game: linkGame,
          account_id: linkFormData.accountId,
          account_tag: linkGame === 'valorant' ? linkFormData.accountTag : null,
          region: linkGame === 'valorant' ? linkFormData.region : null
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setShowLinkModal(false)
      loadStats()
      alert('Аккаунт успешно привязан!')
    } catch (err: unknown) {
      const errorMessage = err && typeof err === 'object' && 'response' in err
        ? (err as any).response?.data?.detail || 'Ошибка привязки аккаунта'
        : 'Ошибка привязки аккаунта'
      alert(errorMessage)
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
          
          {isOwnProfile && (
            <div className={styles.linkButtons}>
              <button onClick={() => handleLinkAccount('steam')} className={styles.linkButton}>
                🎮 Привязать Steam
              </button>
              <button onClick={() => handleLinkAccount('dota2')} className={styles.linkButton}>
                ⚔️ Привязать Dota 2
              </button>
              <button onClick={() => handleLinkAccount('valorant')} className={styles.linkButton}>
                🎯 Привязать Valorant
              </button>
            </div>
          )}
        </div>

        {showLinkModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>Привязать {linkGame === 'steam' ? 'Steam' : linkGame === 'dota2' ? 'Dota 2' : 'Valorant'}</h2>
              <form onSubmit={handleSubmitLink}>
                <div className={styles.formGroup}>
                  <label>
                    {linkGame === 'steam' && 'Steam ID (например: 76561198012345678)'}
                    {linkGame === 'dota2' && 'Dota 2 Account ID (например: 123456789)'}
                    {linkGame === 'valorant' && 'Riot ID (например: PlayerName)'}
                  </label>
                  <input
                    type="text"
                    value={linkFormData.accountId}
                    onChange={(e) => setLinkFormData({ ...linkFormData, accountId: e.target.value })}
                    required
                    placeholder={linkGame === 'steam' ? '76561198012345678' : linkGame === 'dota2' ? '123456789' : 'PlayerName'}
                  />
                </div>

                {linkGame === 'valorant' && (
                  <>
                    <div className={styles.formGroup}>
                      <label>Тег (например: #EUW)</label>
                      <input
                        type="text"
                        value={linkFormData.accountTag}
                        onChange={(e) => setLinkFormData({ ...linkFormData, accountTag: e.target.value })}
                        required
                        placeholder="#EUW"
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Регион</label>
                      <select
                        value={linkFormData.region}
                        onChange={(e) => setLinkFormData({ ...linkFormData, region: e.target.value })}
                      >
                        <option value="eu">Europe</option>
                        <option value="na">North America</option>
                        <option value="ap">Asia Pacific</option>
                        <option value="kr">Korea</option>
                      </select>
                    </div>
                  </>
                )}

                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowLinkModal(false)} className={styles.cancelButton}>
                    Отмена
                  </button>
                  <button type="submit" className={styles.saveButton}>
                    Привязать
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
