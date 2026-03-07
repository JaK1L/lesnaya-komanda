'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageErrorBoundary } from '../../../components/PageErrorBoundary'
import { GrantAchievementModal } from '../../../components/GrantAchievementModal'
import styles from './page.module.css'

interface AchievementType {
  id: number
  name: string
  description: string | null
  icon: string
  category: string
  requirement: any
  points: number
  is_active: boolean
  created_at: string
}

export default function AdminAchievementsPage() {
  const router = useRouter()
  const [achievements, setAchievements] = useState<AchievementType[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showGrantModal, setShowGrantModal] = useState(false)
  const [editingAchievement, setEditingAchievement] = useState<AchievementType | null>(null)
  
  // Debug: проверка что компонент загружен
  useEffect(() => {
    console.log('✅ AdminAchievementsPage loaded with GrantAchievementModal')
  }, [])
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: '🏆',
    category: 'general',
    points: 10,
    is_active: true,
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchAchievements()
  }, [])

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/achievements/types`)
      if (response.ok) {
        const data = await response.json()
        setAchievements(data)
      }
    } catch (err) {
      setError('Ошибка загрузки достижений')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingAchievement(null)
    setFormData({
      name: '',
      description: '',
      icon: '🏆',
      category: 'general',
      points: 10,
      is_active: true,
    })
    setShowModal(true)
  }

  const handleEdit = (achievement: AchievementType) => {
    setEditingAchievement(achievement)
    setFormData({
      name: achievement.name,
      description: achievement.description || '',
      icon: achievement.icon,
      category: achievement.category,
      points: achievement.points,
      is_active: achievement.is_active,
    })
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const token = localStorage.getItem('admin_token')

    try {
      const url = editingAchievement
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/achievements/types/${editingAchievement.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/achievements/types`

      const response = await fetch(url, {
        method: editingAchievement ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...formData,
          requirement: {},
        }),
      })

      if (response.ok) {
        setShowModal(false)
        fetchAchievements()
      } else {
        setError('Ошибка сохранения')
      }
    } catch (err) {
      setError('Ошибка сохранения')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это достижение?')) return

    const token = localStorage.getItem('admin_token')
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/achievements/types/${id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (response.ok) {
        fetchAchievements()
      }
    } catch (err) {
      setError('Ошибка удаления')
    }
  }

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

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    )
  }

  return (
    <PageErrorBoundary pageName="Управление достижениями">
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>🏆 Управление достижениями</h1>
          <button onClick={() => setShowGrantModal(true)} className={styles.grantButton}>
            🎁 Выдать
          </button>
          <button onClick={handleCreate} className={styles.createButton}>
            + Создать
          </button>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.achievementsList}>
          {achievements.map((achievement) => (
            <div key={achievement.id} className={styles.achievementCard}>
              <div className={styles.achievementIcon}>{achievement.icon}</div>
              <div className={styles.achievementInfo}>
                <h3>{achievement.name}</h3>
                <p>{achievement.description}</p>
                <div className={styles.achievementMeta}>
                  <span className={styles.category}>
                    {getCategoryName(achievement.category)}
                  </span>
                  <span className={styles.points}>{achievement.points} очков</span>
                  <span className={achievement.is_active ? styles.active : styles.inactive}>
                    {achievement.is_active ? 'Активно' : 'Неактивно'}
                  </span>
                </div>
              </div>
              <div className={styles.achievementActions}>
                <button
                  onClick={() => handleEdit(achievement)}
                  className={styles.editButton}
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDelete(achievement.id)}
                  className={styles.deleteButton}
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className={styles.modal}>
            <div className={styles.modalContent}>
              <h2>{editingAchievement ? 'Редактировать' : 'Создать'} достижение</h2>
              <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                  <label>Название</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className={styles.formGroup}>
                  <label>Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Иконка</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      required
                    />
                  </div>

                  <div className={styles.formGroup}>
                    <label>Очки</label>
                    <input
                      type="number"
                      value={formData.points}
                      onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                      min="0"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label>Категория</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="general">Общие</option>
                    <option value="activity">Активность</option>
                    <option value="voice">Голосовые</option>
                    <option value="events">События</option>
                    <option value="games">Игры</option>
                    <option value="special">Специальные</option>
                  </select>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    Активно
                  </label>
                </div>

                <div className={styles.modalActions}>
                  <button type="button" onClick={() => setShowModal(false)} className={styles.cancelButton}>
                    Отмена
                  </button>
                  <button type="submit" className={styles.saveButton}>
                    Сохранить
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Модальное окно для выдачи достижений */}
        <GrantAchievementModal
          isOpen={showGrantModal}
          onClose={() => setShowGrantModal(false)}
          onSuccess={() => {
            // Можно добавить уведомление об успехе
            console.log('Достижение успешно выдано!')
          }}
        />
      </div>
    </PageErrorBoundary>
  )
}
