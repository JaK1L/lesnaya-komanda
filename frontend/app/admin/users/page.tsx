'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminTableSkeleton } from '../../../components/skeletons'
import styles from '../news/page.module.css'

interface User {
  id: number
  discord_id: number
  discord_username: string
  forest_rank: string
  rating: number
  joined_at: string | null
  last_seen: string | null
  avatar_url: string | null
}

const RANKS = [
  '🌱 Росток',
  '🌿 Трава',
  '🪵 Бревно',
  '🌲 Дерево',
  '🐺 Старый Волк',
  '🔥 Лесной Дух',
]

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const [newRank, setNewRank] = useState('')
  const [newRating, setNewRating] = useState(0)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchUsers()
  }, [router])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setNewRank(user.forest_rank)
    setNewRating(user.rating)
    setShowEditModal(true)
  }

  const handleSave = async () => {
    if (!editingUser) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${editingUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            forest_rank: newRank,
            rating: newRating,
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to update')
      
      await fetchUsers()
      setShowEditModal(false)
      setEditingUser(null)
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Ошибка при обновлении пользователя')
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>👥 Управление пользователями</h1>
          <div style={{ width: '120px' }} />
        </header>
        <AdminTableSkeleton rows={10} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          ← Назад
        </button>
        <h1>👥 Управление пользователями</h1>
        <div style={{ color: '#888' }}>Всего: {users.length}</div>
      </header>

      <div className={styles.list}>
        {users.length === 0 ? (
          <div className={styles.empty}>
            <p>Пользователей пока нет</p>
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {user.avatar_url && (
                    <img 
                      src={user.avatar_url} 
                      alt={user.discord_username}
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div>
                    <h3>{user.discord_username}</h3>
                    <small style={{ color: '#888' }}>ID: {user.discord_id}</small>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button
                    onClick={() => handleEdit(user)}
                    className={styles.editButton}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                </div>
              </div>
              <div className={styles.cardContent}>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem' }}>
                  <div>
                    <strong>Ранг:</strong> {user.forest_rank}
                  </div>
                  <div>
                    <strong>Рейтинг:</strong> {user.rating}
                  </div>
                  {user.joined_at && (
                    <div>
                      <strong>Присоединился:</strong>{' '}
                      {new Date(user.joined_at).toLocaleDateString('ru-RU')}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Edit Modal */}
      {showEditModal && editingUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--gray)',
            padding: '2rem',
            borderRadius: '12px',
            maxWidth: '500px',
            width: '90%',
          }}>
            <h2 style={{ marginTop: 0 }}>Редактировать пользователя</h2>
            <p style={{ color: '#888' }}>{editingUser.discord_username}</p>

            <div className={styles.formGroup}>
              <label htmlFor="rank">Ранг</label>
              <select
                id="rank"
                value={newRank}
                onChange={(e) => setNewRank(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--background)',
                  border: '1px solid var(--gray-light)',
                  borderRadius: '8px',
                  color: 'var(--foreground)',
                  fontSize: '1rem',
                }}
              >
                {RANKS.map((rank) => (
                  <option key={rank} value={rank}>
                    {rank}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="rating">Рейтинг</label>
              <input
                id="rating"
                type="number"
                value={newRating}
                onChange={(e) => setNewRating(parseFloat(e.target.value))}
                min={0}
                max={100}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  background: 'var(--background)',
                  border: '1px solid var(--gray-light)',
                  borderRadius: '8px',
                  color: 'var(--foreground)',
                  fontSize: '1rem',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
              <button
                onClick={handleSave}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'var(--accent)',
                  color: 'var(--background)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                Сохранить
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false)
                  setEditingUser(null)
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: 'transparent',
                  color: 'var(--foreground)',
                  border: '1px solid var(--gray-light)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
