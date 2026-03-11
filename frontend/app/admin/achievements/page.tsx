'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageErrorBoundary } from '../../../components/PageErrorBoundary'
import { GrantAchievementModal } from '../../../components/GrantAchievementModal'
import { AchievementModal } from '../../../components/admin/AchievementModal'
import { AdminTableSkeleton } from '../../../components/skeletons'
import styles from '../news/page.module.css'

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

  const handleEdit = (achievement: AchievementType) => {
    setEditingAchievement(achievement)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingAchievement(null)
  }

  const handleSave = () => {
    fetchAchievements()
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
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>🏆 Управление достижениями</h1>
          <div style={{ width: '120px' }} />
        </header>
        <AdminTableSkeleton rows={5} />
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
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button onClick={() => setShowGrantModal(true)} style={{
              padding: '0.5rem 1rem',
              background: '#9c27b0',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: 600,
            }}>
              🎁 Выдать
            </button>
            <button onClick={() => setShowModal(true)} className={styles.addButton}>
              + Добавить
            </button>
          </div>
        </header>

        {error && <div className={styles.error}>{error}</div>}

        <AchievementModal
          isOpen={showModal}
          onClose={handleCloseModal}
          onSave={handleSave}
          editingAchievement={editingAchievement}
        />

        <GrantAchievementModal
          isOpen={showGrantModal}
          onClose={() => setShowGrantModal(false)}
          onSuccess={() => {
            console.log('Достижение успешно выдано!')
          }}
        />

        <div className={styles.list}>
          {achievements.map((achievement) => (
            <div key={achievement.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <div style={{ fontSize: '3rem' }}>{achievement.icon}</div>
                  <div>
                    <h3>{achievement.name}</h3>
                    <p style={{ color: '#888', margin: '0.25rem 0' }}>{achievement.description}</p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: '#4CAF50' }}>
                        {getCategoryName(achievement.category)}
                      </span>
                      <span style={{ color: '#ff9800' }}>
                        {achievement.points} очков
                      </span>
                    </div>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <span className={achievement.is_active ? styles.published : styles.draft}>
                    {achievement.is_active ? 'Активно' : 'Неактивно'}
                  </span>
                  <button
                    onClick={() => handleEdit(achievement)}
                    className={styles.editButton}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(achievement.id)}
                    className={styles.deleteButton}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageErrorBoundary>
  )
}
