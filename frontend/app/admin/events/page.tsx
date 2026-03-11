'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { EventModal } from '../../../components/admin/EventModal'
import { AdminTableSkeleton } from '../../../components/skeletons'
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
  const [showModal, setShowModal] = useState(false)
  const [editingEvent, setEditingEvent] = useState<Event | null>(null)

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
      // API возвращает пагинированный ответ с полем items
      setEvents(data.items || data)
    } catch (error) {
      console.error('Error fetching events:', error)
    } finally {
      setIsLoading(false)
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
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingEvent(null)
  }

  const handleSave = () => {
    fetchEvents()
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>📅 Управление событиями</h1>
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
        <h1>📅 Управление событиями</h1>
        <button onClick={() => setShowModal(true)} className={styles.addButton}>
          + Добавить
        </button>
      </header>

      <EventModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingEvent={editingEvent}
      />

      <div className={styles.list}>
        {events.length === 0 ? (
          <div className={styles.empty}>
            <p>Событий пока нет</p>
            <button onClick={() => setShowModal(true)} className={styles.emptyButton}>
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
