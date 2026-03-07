'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../news/page.module.css'

interface Event {
  id: number
  title: string
  description: string
  game: string
  event_date: string
  created_by: number | null
  participants: number[]
  status: string
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    game: 'Общее',
    event_date: '',
    status: 'Планируется',
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchEvents()
  }, [router])

  const fetchEvents = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setEvents(data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to create')
      
      await fetchEvents()
      setShowForm(false)
      setFormData({
        title: '',
        description: '',
        game: 'Общее',
        event_date: '',
        status: 'Планируется',
      })
    } catch (error) {
      console.error('Error creating event:', error)
      alert('Ошибка при создании события')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это событие?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete')
      
      await fetchEvents()
    } catch (error) {
      console.error('Error deleting event:', error)
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
        <h1>📅 Управление событиями</h1>
        <button onClick={() => setShowForm(!showForm)} className={styles.addButton}>
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </header>

      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Название события</label>
              <input
                id="title"
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="CS2 Турнир 5v5"
                required
                maxLength={200}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Описание</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание события..."
                required
                rows={6}
                maxLength={2000}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="game">Игра</label>
              <select
                id="game"
                value={formData.game}
                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
              >
                <option value="Общее">Общее</option>
                <option value="CS2">CS2</option>
                <option value="Dota 2">Dota 2</option>
                <option value="Valorant">Valorant</option>
                <option value="PUBG">PUBG</option>
                <option value="Apex Legends">Apex Legends</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="event_date">Дата и время</label>
              <input
                id="event_date"
                type="datetime-local"
                value={formData.event_date}
                onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="status">Статус</label>
              <select
                id="status"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Планируется">Планируется</option>
                <option value="Регистрация открыта">Регистрация открыта</option>
                <option value="Идет сейчас">Идет сейчас</option>
                <option value="Завершено">Завершено</option>
                <option value="Отменено">Отменено</option>
              </select>
            </div>

            <button type="submit" className={styles.submitButton}>
              Создать событие
            </button>
          </form>
        </div>
      )}

      <div className={styles.list}>
        {events.length === 0 ? (
          <div className={styles.empty}>
            <p>Событий пока нет</p>
            <button onClick={() => setShowForm(true)} className={styles.emptyButton}>
              Создать первое событие
            </button>
          </div>
        ) : (
          events.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{item.title}</h3>
                <div className={styles.cardActions}>
                  <span className={styles.published}>
                    {item.game}
                  </span>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={styles.deleteButton}
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className={styles.cardContent}>{item.description}</p>
              <div className={styles.cardFooter}>
                <span className={styles.date}>
                  📅 {new Date(item.event_date).toLocaleString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
                <span className={styles.draft}>
                  {item.status}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
