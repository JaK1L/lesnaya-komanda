'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

interface News {
  id: number
  title: string
  content: string
  image_url: string | null
  author_id: number | null
  published: boolean
  created_at: string
  updated_at: string | null
}

export default function AdminNewsPage() {
  const router = useRouter()
  const [news, setNews] = useState<News[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingNews, setEditingNews] = useState<News | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    image_url: '',
    published: true,
  })

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('admin_token')
      const url = editingNews
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/${editingNews.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/news`
      
      const method = editingNews ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      await fetchNews()
      setShowForm(false)
      setEditingNews(null)
      setFormData({ title: '', content: '', image_url: '', published: true })
    } catch (error) {
      console.error('Error saving news:', error)
      alert('Ошибка при сохранении новости')
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
    setFormData({
      title: item.title,
      content: item.content,
      image_url: item.image_url || '',
      published: item.published,
    })
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingNews(null)
    setFormData({ title: '', content: '', image_url: '', published: true })
    setShowForm(false)
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
        <h1>📰 Управление новостями</h1>
        <button onClick={() => {
          if (showForm && editingNews) {
            handleCancelEdit()
          } else {
            setShowForm(!showForm)
          }
        }} className={styles.addButton}>
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </header>

      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              {editingNews ? 'Редактировать новость' : 'Создать новость'}
            </h2>
            <div className={styles.formGroup}>
              <label htmlFor="title">Заголовок</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Заголовок новости"
                required
                maxLength={200}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content">Содержание</label>
              <textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Текст новости..."
                required
                rows={10}
                maxLength={5000}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="image_url">URL изображения (необязательно)</label>
              <input
                id="image_url"
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="https://example.com/image.jpg"
                maxLength={500}
              />
              {formData.image_url && (
                <div className={styles.imagePreview}>
                  <img src={formData.image_url} alt="Превью" onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }} />
                </div>
              )}
            </div>

            <div className={styles.formGroup}>
              <label className={styles.checkbox}>
                <input
                  type="checkbox"
                  checked={formData.published}
                  onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
                />
                <span>Опубликовать сразу</span>
              </label>
            </div>

            <button type="submit" className={styles.submitButton}>
              {editingNews ? 'Сохранить изменения' : 'Создать новость'}
            </button>
          </form>
        </div>
      )}

      <div className={styles.list}>
        {news.length === 0 ? (
          <div className={styles.empty}>
            <p>Новостей пока нет</p>
            <button onClick={() => setShowForm(true)} className={styles.emptyButton}>
              Создать первую новость
            </button>
          </div>
        ) : (
          news.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{item.title}</h3>
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
