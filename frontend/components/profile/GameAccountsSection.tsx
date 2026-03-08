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
  const [loading, setLoading] = useState(true)
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
    } catch (err) {
      console.error('Error loading game accounts:', err)
      setError('Не удалось загрузить привязанные аккаунты')
    } finally {
      setLoading(false)
    }
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
