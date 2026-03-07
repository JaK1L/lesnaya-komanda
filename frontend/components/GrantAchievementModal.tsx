'use client'

import { useState, useEffect } from 'react'
import styles from './GrantAchievementModal.module.css'

interface User {
  id: number
  discord_id: number
  discord_username: string
}

interface Achievement {
  id: number
  name: string
  icon: string
  description: string | null
  points: number
  category: string
}

interface UserAchievement {
  id: number
  achievement_type_id: number
  name: string
  icon: string
}

interface GrantAchievementModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function GrantAchievementModal({ isOpen, onClose, onSuccess }: GrantAchievementModalProps) {
  const [users, setUsers] = useState<User[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null)
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadData()
    }
  }, [isOpen])

  useEffect(() => {
    if (selectedUser) {
      loadUserAchievements(selectedUser.discord_id)
    } else {
      setUserAchievements([])
    }
  }, [selectedUser])

  const loadData = async () => {
    try {
      const [usersData, achievementsData] = await Promise.all([
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?limit=1000`).then(r => r.json()),
        fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/achievements/types`).then(r => r.json())
      ])
      
      setUsers(usersData)
      setAchievements(achievementsData)
    } catch (err) {
      setError('Ошибка загрузки данных')
    }
  }

  const loadUserAchievements = async (discordId: number) => {
    try {
      const data = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/achievements/user/${discordId}`
      ).then(r => r.json())
      
      setUserAchievements(data)
    } catch (err) {
      console.error('Ошибка загрузки достижений пользователя:', err)
    }
  }

  const handleGrant = async () => {
    if (!selectedUser || !selectedAchievement) {
      setError('Выберите пользователя и достижение')
      return
    }

    setLoading(true)
    setError('')
    
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/achievements/grant-by-discord/${selectedUser.discord_id}/${selectedAchievement.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.detail || 'Ошибка при выдаче достижения')
      }

      const result = await response.json()
      
      // Обновить список достижений пользователя
      await loadUserAchievements(selectedUser.discord_id)
      
      // Сбросить выбор достижения
      setSelectedAchievement(null)
      
      // Показать успех
      alert(`✅ ${result.message}`)
      
      onSuccess()
      
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedUser(null)
    setSelectedAchievement(null)
    setUserAchievements([])
    setError('')
    setSearchQuery('')
    onClose()
  }

  // Фильтруем достижения которые уже есть у пользователя
  const availableAchievements = achievements.filter(
    a => !userAchievements.some(ua => ua.achievement_type_id === a.id)
  )

  // Фильтруем пользователей по поиску
  const filteredUsers = users.filter(user =>
    user.discord_username.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (!isOpen) return null

  return (
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>🏆 Выдать достижение</h2>
          <button onClick={handleClose} className={styles.closeButton}>×</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.modalBody}>
          {/* Выбор пользователя */}
          <div className={styles.formGroup}>
            <label>Пользователь:</label>
            <input
              type="text"
              placeholder="Поиск по имени..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
            <select 
              value={selectedUser?.id || ''} 
              onChange={(e) => {
                const user = users.find(u => u.id === Number(e.target.value))
                setSelectedUser(user || null)
                setSelectedAchievement(null)
              }}
              className={styles.select}
            >
              <option value="">Выберите пользователя</option>
              {filteredUsers.map(user => (
                <option key={user.id} value={user.id}>
                  {user.discord_username}
                </option>
              ))}
            </select>
          </div>

          {/* Показать уже полученные достижения */}
          {selectedUser && userAchievements.length > 0 && (
            <div className={styles.userAchievements}>
              <h3>Уже получено ({userAchievements.length}):</h3>
              <div className={styles.achievementBadges}>
                {userAchievements.map(a => (
                  <span key={a.id} className={styles.badge}>
                    {a.icon} {a.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Выбор достижения */}
          {selectedUser && (
            <div className={styles.formGroup}>
              <label>Достижение:</label>
              {availableAchievements.length === 0 ? (
                <p className={styles.noAchievements}>
                  У пользователя уже есть все достижения! 🎉
                </p>
              ) : (
                <>
                  <select
                    value={selectedAchievement?.id || ''}
                    onChange={(e) => {
                      const achievement = achievements.find(
                        a => a.id === Number(e.target.value)
                      )
                      setSelectedAchievement(achievement || null)
                    }}
                    className={styles.select}
                  >
                    <option value="">Выберите достижение</option>
                    {availableAchievements.map(achievement => (
                      <option key={achievement.id} value={achievement.id}>
                        {achievement.icon} {achievement.name} ({achievement.points} поинтов)
                      </option>
                    ))}
                  </select>
                  
                  {selectedAchievement && (
                    <div className={styles.achievementPreview}>
                      <span className={styles.previewIcon}>{selectedAchievement.icon}</span>
                      <div>
                        <strong>{selectedAchievement.name}</strong>
                        <p>{selectedAchievement.description}</p>
                        <span className={styles.previewPoints}>
                          +{selectedAchievement.points} поинтов
                        </span>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Кнопки */}
        <div className={styles.modalFooter}>
          <button 
            onClick={handleClose}
            className={styles.cancelButton}
          >
            Отмена
          </button>
          <button 
            onClick={handleGrant} 
            disabled={!selectedUser || !selectedAchievement || loading || availableAchievements.length === 0}
            className={styles.grantButton}
          >
            {loading ? 'Выдача...' : 'Выдать достижение'}
          </button>
        </div>
      </div>
    </div>
  )
}
