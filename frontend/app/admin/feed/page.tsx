'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FeedModal } from '../../../components/admin/FeedModal'
import { AdminTableSkeleton } from '../../../components/skeletons'
import styles from '../news/page.module.css'

interface FeedItem {
  id: number
  kind: 'post' | 'achievement'
  title: string
  content: string | null
  created_at: string
}

export default function AdminFeedPage() {
  const router = useRouter()
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingFeed, setEditingFeed] = useState<FeedItem | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchFeed()
  }, [router])

  const fetchFeed = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/feed`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setFeed(data)
    } catch (error) {
      console.error('Error fetching feed:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту запись?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/feed/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete')
      
      await fetchFeed()
    } catch (error) {
      console.error('Error deleting feed item:', error)
      alert('Ошибка при удалении')
    }
  }

  const handleEdit = (item: FeedItem) => {
    setEditingFeed(item)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingFeed(null)
  }

  const handleSave = () => {
    fetchFeed()
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>📝 Управление лентой</h1>
          <div style={{ width: '120px' }} />
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
        <h1>📝 Управление лентой</h1>
        <button onClick={() => setShowModal(true)} className={styles.addButton}>
          + Добавить
        </button>
      </header>

      <FeedModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingFeed={editingFeed}
      />

      <div className={styles.list}>
        {feed.length === 0 ? (
          <div className={styles.empty}>
            <p>Записей пока нет</p>
            <button onClick={() => setShowModal(true)} className={styles.emptyButton}>
              Создать первую запись
            </button>
          </div>
        ) : (
          feed.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{item.title}</h3>
                <div className={styles.cardActions}>
                  <span className={item.kind === 'post' ? styles.published : styles.draft}>
                    {item.kind === 'post' ? '📝 Пост' : '🏆 Достижение'}
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
              {item.content && (
                <p className={styles.cardContent}>{item.content}</p>
              )}
              <div className={styles.cardFooter}>
                <span className={styles.date}>
                  {new Date(item.created_at).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
