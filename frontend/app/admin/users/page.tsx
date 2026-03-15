'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Trash2, User, Zap } from 'lucide-react'
import { UserModal } from '../../../components/admin/UserModal'
import { AdminTableSkeleton } from '../../../components/skeletons'
import { getImageUrl } from '../../../lib/imageUtils'
import styles from '../news/page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  const [xpModal, setXpModal] = useState<User | null>(null)
  const [xpAmount, setXpAmount] = useState(100)
  const [xpReason, setXpReason] = useState('Выдано администратором')
  const [xpLoading, setXpLoading] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    void fetchUsers()
  }, [router])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${API_URL}/api/admin/users?limit=100`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      setUsers(data.items ?? data)
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
    void fetchUsers()
  }

  const handleOpenProfile = (user: User) => {
    router.push(`/profile/${encodeURIComponent(String(user.discord_id))}`)
  }

  const handleDelete = async (user: User) => {
    if (!confirm(`Удалить пользователя ${user.discord_username}?`)) return
    const token = localStorage.getItem('admin_token')
    await fetch(`${API_URL}/api/admin/users/${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    void fetchUsers()
  }

  const handleGrantXp = async () => {
    if (!xpModal || xpAmount <= 0) return
    setXpLoading(true)
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(
        `${API_URL}/api/achievements/grant-xp/${xpModal.id}?amount=${xpAmount}&reason=${encodeURIComponent(xpReason)}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
        },
      )
      if (!response.ok) throw new Error()
      const data = await response.json()
      alert(`${data.message}\nУровень: ${data.level} | Ранг: ${data.rank}`)
      setXpModal(null)
      void fetchUsers()
    } catch {
      alert('Ошибка при выдаче XP')
    } finally {
      setXpLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>← Назад</button>
          <h1>Управление пользователями</h1>
          <div style={{ width: '120px' }} />
        </header>
        <AdminTableSkeleton rows={10} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>← Назад</button>
        <h1>Управление пользователями</h1>
        <div style={{ color: '#888' }}>Всего: {users.length}</div>
      </header>

      {xpModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setXpModal(null)}
        >
          <div
            style={{ background: '#1a1a2e', border: '1px solid #333', borderRadius: '16px', padding: '2rem', width: '360px' }}
            onClick={(event) => event.stopPropagation()}
          >
            <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Zap size={18} />
              Выдать XP - {xpModal.discord_username}
            </h3>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#aaa' }}>Количество XP</label>
            <input
              type="number"
              min={1}
              value={xpAmount}
              onChange={(event) => setXpAmount(Number(event.target.value))}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', marginBottom: '1rem' }}
            />
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.85rem', color: '#aaa' }}>Причина</label>
            <input
              type="text"
              value={xpReason}
              onChange={(event) => setXpReason(event.target.value)}
              style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #444', background: '#111', color: '#fff', marginBottom: '1.5rem' }}
            />
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                onClick={handleGrantXp}
                disabled={xpLoading}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', background: '#7c3aed', border: 'none', color: '#fff', cursor: 'pointer', fontWeight: 600 }}
              >
                {xpLoading ? 'Выдача...' : 'Выдать'}
              </button>
              <button
                onClick={() => setXpModal(null)}
                style={{ flex: 1, padding: '0.7rem', borderRadius: '8px', background: '#333', border: 'none', color: '#fff', cursor: 'pointer' }}
              >
                Отмена
              </button>
            </div>
          </div>
        </div>
      )}

      <UserModal isOpen={showModal} onClose={handleCloseModal} onSave={handleSave} editingUser={editingUser} />

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
                      src={getImageUrl(user.avatar_url) || user.avatar_url}
                      alt={user.discord_username}
                      style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  )}
                  <div>
                    <h3>{user.discord_username}</h3>
                    <small style={{ color: '#888' }}>ID: {user.discord_id}</small>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <button onClick={() => handleOpenProfile(user)} className={styles.editButton} title="Открыть профиль">
                    <User size={15} />
                  </button>
                  <button onClick={() => setXpModal(user)} className={styles.editButton} title="Выдать XP">
                    <Zap size={15} />
                  </button>
                  <button onClick={() => handleEdit(user)} className={styles.editButton} title="Редактировать">
                    <Pencil size={15} />
                  </button>
                  <button onClick={() => handleDelete(user)} className={styles.deleteButton} title="Удалить">
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              <div className={styles.cardContent}>
                <div style={{ display: 'flex', gap: '2rem', marginTop: '1rem', flexWrap: 'wrap' }}>
                  <div><strong>Ранг:</strong> {user.forest_rank}</div>
                  <div><strong>Рейтинг:</strong> {user.rating}</div>
                  {user.joined_at && (
                    <div><strong>Присоединился:</strong> {new Date(user.joined_at).toLocaleDateString('ru-RU')}</div>
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
