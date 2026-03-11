'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserModal } from '../../../components/admin/UserModal'
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

export default function AdminUsersPage() {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

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
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingUser(null)
  }

  const handleSave = () => {
    fetchUsers()
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

      <UserModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingUser={editingUser}
      />

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
    </div>
  )
}
