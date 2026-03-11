'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { StreamerModal } from '../../../components/admin/StreamerModal'
import { AdminTableSkeleton } from '../../../components/skeletons'
import styles from '../news/page.module.css'

interface Streamer {
  id: number
  twitch_username: string
  display_name: string
  avatar_url: string | null
  description: string | null
  is_active: boolean
  display_order: number
  // Live данные
  is_live?: boolean
  game_name?: string | null
  stream_title?: string | null
  viewer_count?: number
}

export default function AdminStreamersPage() {
  const router = useRouter()
  const [streamers, setStreamers] = useState<Streamer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchStreamers()
  }, [router])

  const fetchStreamers = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/streamers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error('Failed to fetch streamers:', response.status, response.statusText)
        throw new Error('Failed to fetch')
      }
      
      const data = await response.json()
      console.log('Streamers loaded:', data)
      setStreamers(data)
    } catch (error) {
      console.error('Error fetching streamers:', error)
      alert('Ошибка загрузки стримеров. Проверьте консоль для деталей.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этого стримера?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/streamers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete')
      
      await fetchStreamers()
    } catch (error) {
      console.error('Error deleting streamer:', error)
      alert('Ошибка при удалении')
    }
  }

  const handleEdit = (item: Streamer) => {
    setEditingStreamer(item)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingStreamer(null)
  }

  const handleSave = () => {
    fetchStreamers()
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>🎮 Управление стримерами</h1>
          <div style={{ width: '120px' }} /> {/* Spacer */}
        </header>
        <AdminTableSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          ← Назад
        </button>
        <h1>🎮 Управление стримерами</h1>
        <button onClick={() => setShowModal(true)} className={styles.addButton}>
          + Добавить
        </button>
      </header>

      <StreamerModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingStreamer={editingStreamer}
      />

      <div className={styles.list}>
        {streamers.length === 0 ? (
          <div className={styles.empty}>
            <p>Стримеров пока нет</p>
            <button onClick={() => setShowModal(true)} className={styles.emptyButton}>
              Добавить первого стримера
            </button>
          </div>
        ) : (
          streamers.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {item.avatar_url && (
                    <img 
                      src={item.avatar_url} 
                      alt={item.display_name}
                      style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: item.is_live ? '3px solid #9146ff' : '3px solid transparent'
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>{item.display_name}</h3>
                      {item.is_live && (
                        <span style={{ 
                          background: '#eb0400', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          🔴 LIVE
                        </span>
                      )}
                    </div>
                    <small style={{ color: '#888' }}>@{item.twitch_username}</small>
                    {item.is_live && item.viewer_count && item.viewer_count > 0 && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#666' }}>
                        👁️ {item.viewer_count.toLocaleString()} зрителей
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <span className={item.is_active ? styles.published : styles.draft}>
                    {item.is_active ? 'Активен' : 'Скрыт'}
                  </span>
                  <button
                    onClick={() => handleEdit(item)}
                    className={styles.editButton}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={styles.deleteButton}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              
              {item.description && (
                <p className={styles.cardContent} style={{ 
                  marginTop: '0.75rem',
                  color: '#666',
                  fontSize: '0.9rem'
                }}>
                  {item.description}
                </p>
              )}
              
              {item.is_live && item.game_name && (
                <div style={{ 
                  marginTop: '0.75rem',
                  padding: '0.5rem',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}>
                  <strong>🎮 {item.game_name}</strong>
                  {item.stream_title && (
                    <div style={{ marginTop: '0.25rem', color: '#666' }}>
                      {item.stream_title}
                    </div>
                  )}
                </div>
              )}
              
              <div className={styles.cardFooter} style={{ marginTop: '0.75rem' }}>
                <span className={styles.date}>
                  🔗 twitch.tv/{item.twitch_username}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
