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
  telegram_url: string | null
  created_by: number | null
  participants: number[]
  status: string
  expires_at: string | null
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<Event[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    game: 'Общее',
    event_date: '',
    telegram_url: '',
    status: 'Планируется',
    expires_at: '',
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
      const url = editingEvent
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/${editingEvent.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/events`
      
      const method = editingEvent ? 'PUT' : 'POST'
      
      // Подготавливаем данные - если expires_at пустое, отправляем null
      const payload = {
        ...formData,
        expires_at: formData.expires_at || null
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      await fetchEvents()
      setShowForm(false)
      setEditingEvent(null)
      setFormData({
        title: '',
        description: '',
        game: 'Общее',
        event_date: '',
        telegram_url: '',
        status: 'Планируется',
        expires_at: '',
      })
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Ошибка при сохранении события')
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

  const handleEdit = (item: Event) => {
    setEditingEvent(item)
    // Преобразуем дату в формат datetime-local
    const eventDate = new Date(item.event_date)
    const localDate = new Date(eventDate.getTime() - eventDate.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16)
    
    // Преобразуем expires_at если есть
    let expiresDate = ''
    if (item.expires_at) {
      const expires = new Date(item.expires_at)
      expiresDate = new Date(expires.getTime() - expires.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
    }
    
    setFormData({
      title: item.title,
      description: item.description,
      game: item.game,
      event_date: localDate,
      telegram_url: item.telegram_url || '',
      status: item.status,
      expires_at: expiresDate,
    })
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingEvent(null)
    setFormData({
      title: '',
      description: '',
      game: 'Общее',
      event_date: '',
      telegram_url: '',
      status: 'Планируется',
      expires_at: '',
    })
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
        <h1>📅 Управление событиями</h1>
        <button onClick={() => {
          if (showForm && editingEvent) {
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
              {editingEvent ? 'Редактировать событие' : 'Создать событие'}
            </h2>
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
              <label htmlFor="expires_at">Скрыть событие после (необязательно)</label>
              <input
                id="expires_at"
                type="datetime-local"
                value={formData.expires_at}
                onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
              />
              <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                Событие автоматически исчезнет с сайта после указанной даты. Оставьте пустым, чтобы событие не скрывалось автоматически.
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="telegram_url">Ссылка на Telegram пост (необязательно)</label>
              <input
                id="telegram_url"
                type="url"
                value={formData.telegram_url}
                onChange={(e) => setFormData({ ...formData, telegram_url: e.target.value })}
                placeholder="https://t.me/channel/123"
                maxLength={500}
              />
              <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                При клике на событие пользователь перейдет по этой ссылке
              </small>
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
              {editingEvent ? 'Сохранить изменения' : 'Создать событие'}
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
