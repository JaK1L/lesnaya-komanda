'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './GameAccountsSection.module.css'

interface GameAccount {
  id: number
  game: string
  account_id: string
  account_tag?: string
  region?: string
  linked_at: string
}

interface GameStats {
  steam?: {
    profile?: any
    cs2_stats?: any
  }
  dota2?: {
    profile?: any
    stats?: any
  }
  valorant?: {
    profile?: any
    mmr?: any
  }
}

interface Props {
  isOwnProfile: boolean
  apiUrl: string
  token?: string | null
}

const GAME_NAMES: Record<string, string> = {
  steam: 'Steam',
  dota2: 'Dota 2',
  valorant: 'Valorant',
}

const GAME_ICONS: Record<string, string> = {
  steam: '🎮',
  dota2: '⚔️',
  valorant: '🎯',
}

export function GameAccountsSection({ isOwnProfile, apiUrl, token }: Props) {
  const [accounts, setAccounts] = useState<GameAccount[]>([])
  const [stats, setStats] = useState<GameStats>({})
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAdding, setIsAdding] = useState(false)
  
  // Form state
  const [selectedGame, setSelectedGame] = useState<string>('steam')
  const [accountId, setAccountId] = useState('')
  const [accountTag, setAccountTag] = useState('')
  const [region, setRegion] = useState('eu')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOwnProfile && token) {
      loadAccounts()
    }
  }, [isOwnProfile, token])

  const loadAccounts = async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get<GameAccount[]>(
        `${apiUrl}/api/game-stats/my-accounts`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )
      
      setAccounts(response.data)
      
      // Загружаем статистику для каждого аккаунта
      if (response.data.length > 0) {
        loadStats(response.data)
      }
    } catch (err) {
      console.error('Error loading game accounts:', err)
      setError('Не удалось загрузить привязанные аккаунты')
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (accountsList: GameAccount[]) => {
    setLoadingStats(true)
    const newStats: GameStats = {}

    for (const account of accountsList) {
      try {
        if (account.game === 'steam') {
          console.log(`Loading Steam stats for ${account.account_id}...`)
          const [profile, cs2Stats] = await Promise.all([
            axios.get(`${apiUrl}/api/game-stats/steam/${account.account_id}`)
              .then(res => {
                console.log('Steam profile loaded:', res.data)
                return res
              })
              .catch(err => {
                console.error('Steam profile error:', err.response?.data || err.message)
                return null
              }),
            axios.get(`${apiUrl}/api/game-stats/cs2/${account.account_id}`)
              .then(res => {
                console.log('CS2 stats loaded:', res.data)
                return res
              })
              .catch(err => {
                console.error('CS2 stats error:', err.response?.data || err.message)
                return null
              }),
          ])
          
          newStats.steam = {
            profile: profile?.data,
            cs2_stats: cs2Stats?.data,
          }
        } else if (account.game === 'dota2') {
          console.log(`Loading Dota 2 stats for ${account.account_id}...`)
          const [profile, stats] = await Promise.all([
            axios.get(`${apiUrl}/api/game-stats/dota2/${account.account_id}/profile`)
              .then(res => {
                console.log('Dota 2 profile loaded:', res.data)
                return res
              })
              .catch(err => {
                console.error('Dota 2 profile error:', err.response?.data || err.message)
                return null
              }),
            axios.get(`${apiUrl}/api/game-stats/dota2/${account.account_id}/stats`)
              .then(res => {
                console.log('Dota 2 stats loaded:', res.data)
                return res
              })
              .catch(err => {
                console.error('Dota 2 stats error:', err.response?.data || err.message)
                return null
              }),
          ])
          
          newStats.dota2 = {
            profile: profile?.data,
            stats: stats?.data,
          }
        } else if (account.game === 'valorant' && account.account_tag) {
          const region = account.region || 'eu'
          console.log(`Loading Valorant stats for ${account.account_id}#${account.account_tag} (${region})...`)
          const [profile, mmr] = await Promise.all([
            axios.get(`${apiUrl}/api/game-stats/valorant/${account.account_id}/${account.account_tag}/profile?region=${region}`)
              .then(res => {
                console.log('Valorant profile loaded:', res.data)
                return res
              })
              .catch(err => {
                console.error('Valorant profile error:', err.response?.data || err.message)
                return null
              }),
            axios.get(`${apiUrl}/api/game-stats/valorant/${account.account_id}/${account.account_tag}/mmr?region=${region}`)
              .then(res => {
                console.log('Valorant MMR loaded:', res.data)
                return res
              })
              .catch(err => {
                console.error('Valorant MMR error:', err.response?.data || err.message)
                return null
              }),
          ])
          
          newStats.valorant = {
            profile: profile?.data,
            mmr: mmr?.data,
          }
        }
      } catch (err) {
        console.error(`Error loading stats for ${account.game}:`, err)
      }
    }

    console.log('Final stats:', newStats)
    setStats(newStats)
    setLoadingStats(false)
  }

  const handleAddAccount = async () => {
    if (!token || !accountId.trim()) return

    try {
      setSaving(true)
      setError(null)

      await axios.post(
        `${apiUrl}/api/game-stats/link`,
        {
          game: selectedGame,
          account_id: accountId.trim(),
          account_tag: selectedGame === 'valorant' ? accountTag.trim() : null,
          region: selectedGame === 'valorant' ? region : null,
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      // Reload accounts
      await loadAccounts()
      
      // Reset form
      setAccountId('')
      setAccountTag('')
      setIsAdding(false)
    } catch (err) {
      console.error('Error adding account:', err)
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Не удалось привязать аккаунт')
      } else {
        setError('Не удалось привязать аккаунт')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveAccount = async (game: string) => {
    if (!token || !confirm(`Отвязать аккаунт ${GAME_NAMES[game]}?`)) return

    try {
      await axios.delete(
        `${apiUrl}/api/game-stats/${game}`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      // Reload accounts
      await loadAccounts()
    } catch (err) {
      console.error('Error removing account:', err)
      setError('Не удалось отвязать аккаунт')
    }
  }

  const renderStats = (game: string) => {
    if (loadingStats) {
      return (
        <div className={styles.statsContent}>
          <div className={styles.statsLoading}>Загрузка статистики...</div>
        </div>
      )
    }

    if (game === 'steam' && stats.steam) {
      const { profile, cs2_stats } = stats.steam
      return (
        <div className={styles.statsContent}>
          {profile && (
            <div className={styles.profileInfo}>
              {profile.avatar_url && (
                <img src={profile.avatar_url} alt="Avatar" className={styles.avatar} />
              )}
              <div>
                <div className={styles.username}>{profile.username || 'N/A'}</div>
                <div className={styles.status}>{profile.status}</div>
              </div>
            </div>
          )}
          {cs2_stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Убийств</div>
                <div className={styles.statValue}>{cs2_stats.kills?.toLocaleString() || 0}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Смертей</div>
                <div className={styles.statValue}>{cs2_stats.deaths?.toLocaleString() || 0}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>K/D</div>
                <div className={styles.statValue}>{cs2_stats.kd_ratio?.toFixed(2) || '0.00'}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Побед</div>
                <div className={styles.statValue}>{cs2_stats.wins?.toLocaleString() || 0}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Винрейт</div>
                <div className={styles.statValue}>{cs2_stats.win_rate?.toFixed(1) || 0}%</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>MVP</div>
                <div className={styles.statValue}>{cs2_stats.mvps?.toLocaleString() || 0}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Хедшотов</div>
                <div className={styles.statValue}>{cs2_stats.headshots?.toLocaleString() || 0}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>HS %</div>
                <div className={styles.statValue}>{cs2_stats.headshot_pct?.toFixed(1) || 0}%</div>
              </div>
              {cs2_stats.damage_per_round > 0 && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Урон/раунд</div>
                  <div className={styles.statValue}>{cs2_stats.damage_per_round?.toFixed(1) || 0}</div>
                </div>
              )}
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Матчей</div>
                <div className={styles.statValue}>{cs2_stats.matches_played?.toLocaleString() || 0}</div>
              </div>
            </div>
          )}
          {!cs2_stats && <div className={styles.noStats}>Статистика CS2 недоступна</div>}
        </div>
      )
    }

    if (game === 'dota2' && stats.dota2) {
      const { profile, stats: dota2Stats } = stats.dota2
      return (
        <div className={styles.statsContent}>
          {profile && (
            <div className={styles.profileInfo}>
              {profile.avatar_url && (
                <img src={profile.avatar_url} alt="Avatar" className={styles.avatar} />
              )}
              <div>
                <div className={styles.username}>{profile.username || 'N/A'}</div>
                {profile.rank_tier && (
                  <div className={styles.rank}>Ранг: {Math.floor(profile.rank_tier / 10)} звезд {profile.rank_tier % 10}</div>
                )}
              </div>
            </div>
          )}
          {dota2Stats && (
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Побед</div>
                <div className={styles.statValue}>{dota2Stats.wins?.toLocaleString() || 0}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Поражений</div>
                <div className={styles.statValue}>{dota2Stats.losses?.toLocaleString() || 0}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Всего матчей</div>
                <div className={styles.statValue}>{dota2Stats.total_matches?.toLocaleString() || 0}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Винрейт</div>
                <div className={styles.statValue}>{dota2Stats.win_rate || 0}%</div>
              </div>
              {profile?.mmr_estimate && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>MMR (оценка)</div>
                  <div className={styles.statValue}>{profile.mmr_estimate.toLocaleString()}</div>
                </div>
              )}
              {profile?.leaderboard_rank && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Место в рейтинге</div>
                  <div className={styles.statValue}>#{profile.leaderboard_rank.toLocaleString()}</div>
                </div>
              )}
            </div>
          )}
          {!dota2Stats && <div className={styles.noStats}>Статистика Dota 2 недоступна</div>}
        </div>
      )
    }

    if (game === 'valorant' && stats.valorant) {
      const { profile, mmr } = stats.valorant
      return (
        <div className={styles.statsContent}>
          {profile && (
            <div className={styles.profileInfo}>
              <div>
                <div className={styles.username}>{profile.username || 'N/A'}</div>
                {profile.account_level && (
                  <div className={styles.level}>Уровень: {profile.account_level}</div>
                )}
              </div>
            </div>
          )}
          {mmr && (
            <div className={styles.statsGrid}>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>Текущий ранг</div>
                <div className={styles.statValue}>{mmr.current_tier || 'Unranked'}</div>
              </div>
              <div className={styles.statBox}>
                <div className={styles.statLabel}>RR</div>
                <div className={styles.statValue}>{mmr.ranking_in_tier || 0}</div>
              </div>
              {mmr.peak_rank && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Пик ранг</div>
                  <div className={styles.statValue}>{mmr.peak_rank}</div>
                </div>
              )}
              {mmr.wins > 0 && (
                <>
                  <div className={styles.statBox}>
                    <div className={styles.statLabel}>Побед</div>
                    <div className={styles.statValue}>{mmr.wins?.toLocaleString() || 0}</div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statLabel}>Поражений</div>
                    <div className={styles.statValue}>{mmr.losses?.toLocaleString() || 0}</div>
                  </div>
                  <div className={styles.statBox}>
                    <div className={styles.statLabel}>Винрейт</div>
                    <div className={styles.statValue}>{mmr.win_rate?.toFixed(1) || 0}%</div>
                  </div>
                </>
              )}
              {mmr.kd_ratio > 0 && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>K/D</div>
                  <div className={styles.statValue}>{mmr.kd_ratio?.toFixed(2) || '0.00'}</div>
                </div>
              )}
              {mmr.headshot_pct > 0 && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>HS %</div>
                  <div className={styles.statValue}>{mmr.headshot_pct?.toFixed(1) || 0}%</div>
                </div>
              )}
              {mmr.elo > 0 && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>ELO</div>
                  <div className={styles.statValue}>{mmr.elo?.toLocaleString() || 'N/A'}</div>
                </div>
              )}
              {mmr.mmr_change !== undefined && mmr.mmr_change !== 0 && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Изменение MMR</div>
                  <div className={styles.statValue} style={{ color: mmr.mmr_change >= 0 ? '#4ade80' : '#f87171' }}>
                    {mmr.mmr_change > 0 ? '+' : ''}{mmr.mmr_change || 0}
                  </div>
                </div>
              )}
              {mmr.games_needed_for_rating > 0 && (
                <div className={styles.statBox}>
                  <div className={styles.statLabel}>Игр до калибровки</div>
                  <div className={styles.statValue}>{mmr.games_needed_for_rating}</div>
                </div>
              )}
            </div>
          )}
          {!mmr && <div className={styles.noStats}>Статистика Valorant недоступна</div>}
        </div>
      )
    }

    return <div className={styles.noStats}>Статистика недоступна</div>
  }

  if (!isOwnProfile) {
    return null // Пока показываем только для своего профиля
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h3>ПРИВЯЗАННЫЕ АККАУНТЫ</h3>
        {!isAdding && (
          <button
            className={styles.addButton}
            onClick={() => setIsAdding(true)}
            aria-label="Добавить аккаунт"
          >
            + Добавить
          </button>
        )}
      </div>

      {error && (
        <div className={styles.error}>
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : (
        <>
          {/* Список привязанных аккаунтов */}
          {accounts.length > 0 ? (
            <div className={styles.accountsList}>
              {accounts.map((account) => (
                <div key={account.id} className={styles.accountCard}>
                  <div className={styles.accountHeader}>
                    <div className={styles.accountInfo}>
                      <span className={styles.gameIcon}>
                        {GAME_ICONS[account.game]}
                      </span>
                      <div className={styles.accountDetails}>
                        <div className={styles.gameName}>
                          {GAME_NAMES[account.game]}
                        </div>
                        <div className={styles.accountId}>
                          {account.game === 'valorant' && account.account_tag
                            ? `${account.account_id}#${account.account_tag}`
                            : account.account_id}
                        </div>
                        {account.region && (
                          <div className={styles.region}>
                            Регион: {account.region.toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      className={styles.removeButton}
                      onClick={() => handleRemoveAccount(account.game)}
                      aria-label={`Отвязать ${GAME_NAMES[account.game]}`}
                    >
                      ✕
                    </button>
                  </div>
                  {renderStats(account.game)}
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.empty}>
              <div className={styles.emptyIcon}>🎮</div>
              <div>Нет привязанных аккаунтов</div>
              <div className={styles.emptyHint}>
                Привяжите игровые аккаунты для отображения статистики
              </div>
            </div>
          )}

          {/* Форма добавления */}
          {isAdding && (
            <div className={styles.addForm}>
              <h4>Добавить аккаунт</h4>
              
              <div className={styles.formGroup}>
                <label htmlFor="game-select">Игра/Платформа</label>
                <select
                  id="game-select"
                  value={selectedGame}
                  onChange={(e) => setSelectedGame(e.target.value)}
                  className={styles.select}
                >
                  <option value="steam">Steam</option>
                  <option value="dota2">Dota 2</option>
                  <option value="valorant">Valorant</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="account-id">
                  {selectedGame === 'steam' && 'Steam ID'}
                  {selectedGame === 'dota2' && 'Dota 2 Account ID'}
                  {selectedGame === 'valorant' && 'Riot ID'}
                </label>
                <input
                  id="account-id"
                  type="text"
                  value={accountId}
                  onChange={(e) => setAccountId(e.target.value)}
                  placeholder={
                    selectedGame === 'steam' ? '76561198012345678' :
                    selectedGame === 'dota2' ? '123456789' :
                    'PlayerName'
                  }
                  className={styles.input}
                />
              </div>

              {selectedGame === 'valorant' && (
                <>
                  <div className={styles.formGroup}>
                    <label htmlFor="account-tag">Тег</label>
                    <input
                      id="account-tag"
                      type="text"
                      value={accountTag}
                      onChange={(e) => setAccountTag(e.target.value)}
                      placeholder="TAG"
                      className={styles.input}
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label htmlFor="region-select">Регион</label>
                    <select
                      id="region-select"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className={styles.select}
                    >
                      <option value="eu">Europe</option>
                      <option value="na">North America</option>
                      <option value="ap">Asia Pacific</option>
                      <option value="kr">Korea</option>
                    </select>
                  </div>
                </>
              )}

              <div className={styles.formActions}>
                <button
                  className={styles.saveButton}
                  onClick={handleAddAccount}
                  disabled={saving || !accountId.trim()}
                >
                  {saving ? 'Сохранение...' : 'Привязать'}
                </button>
                <button
                  className={styles.cancelButton}
                  onClick={() => {
                    setIsAdding(false)
                    setAccountId('')
                    setAccountTag('')
                    setError(null)
                  }}
                  disabled={saving}
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
