'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AdminTableSkeleton } from '../../../components/skeletons'
import { NewsModal } from '../../../components/admin/NewsModal'
import styles from './page.module.css'

interface News {
  id: number
  title: string
  content: string
  image_url: string | null
  author_id: number | null
  published: boolean
  tags: string[]
  created_at: string
  updated_at: string | null
}

export default function AdminNewsPage() {
  const router = useRouter()
  const [news, setNews] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchNews()
  }, [router])

  const fetchNews = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setNews(data)
    } catch (error) {
      console.error('Error fetching news:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту новость?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete')
      
      await fetchNews()
    } catch (error) {
      console.error('Error deleting news:', error)
      alert('Ошибка при удалении')
    }
  }

  const handleEdit = (item: News) => {
    setEditingNews(item)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingNews(null)
  }

  const handleSave = () => {
    fetchNews()
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>📰 Управление новостями</h1>
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
        <h1>📰 Управление новостями</h1>
        <button onClick={() => setShowModal(true)} className={styles.addButton}>
          + Добавить
        </button>
      </header>

      <NewsModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingNews={editingNews}
      />

      <div className={styles.list}>
        {news.length === 0 ? (
          <div className={styles.empty}>
            <p>Новостей пока нет</p>
            <button onClick={() => setShowModal(true)} className={styles.emptyButton}>
              Создать первую новость
            </button>
          </div>
        ) : (
          news.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.cardTitleSection}>
                  <h3>{item.title}</h3>
                  {item.tags && item.tags.length > 0 && (
                    <div className={styles.tags}>
                      {item.tags.map((tag) => (
                        <span key={tag} className={styles.tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div className={styles.cardActions}>
                  <span className={item.published ? styles.published : styles.draft}>
                    {item.published ? '✓ Опубликовано' : '○ Черновик'}
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
              {item.image_url && (
                <div className={styles.cardImage}>
                  <img src={item.image_url} alt={item.title} />
                </div>
              )}
              <p className={styles.cardContent}>{item.content}</p>
              <div className={styles.cardFooter}>
                <span className={styles.date}>
                  {new Date(item.created_at).toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
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
