'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    kind: 'post' as 'post' | 'achievement',
    title: '',
    content: '',
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/feed`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          content: formData.content || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to create')
      
      await fetchFeed()
      setShowForm(false)
      setFormData({ kind: 'post', title: '', content: '' })
    } catch (error) {
      console.error('Error creating feed item:', error)
      alert('Ошибка при создании записи')
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

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          ← Назад
        </button>
        <h1>📝 Управление лентой</h1>
        <button onClick={() => setShowForm(!showForm)} className={styles.addButton}>
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </header>

      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="kind">Тип записи</label>
              <select
                id="kind"
                value={formData.kind}
                onChange={(e) => setFormData({ ...formData, kind: e.target.value as 'post' | 'achievement' })}
              >
                <option value="post">📝 Пост</option>
                <option value="achievement">🏆 Достижение</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">Заголовок</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={
                  formData.kind === 'post'
                    ? 'Новый рекорд сервера!'
                    : 'JaK1L получил достижение "Мастер CS2"'
                }
                required
                maxLength={200}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content">Описание (необязательно)</label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Дополнительная информация..."
                rows={4}
                maxLength={2000}
              />
            </div>

            <button type="submit" className={styles.submitButton}>
              Создать запись
            </button>
          </form>
        </div>
      )}

      <div className={styles.list}>
        {feed.length === 0 ? (
          <div className={styles.empty}>
            <p>Записей пока нет</p>
            <button onClick={() => setShowForm(true)} className={styles.emptyButton}>
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
                    onClick={() => handleDelete(item.id)}
                    className={styles.deleteButton}
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
