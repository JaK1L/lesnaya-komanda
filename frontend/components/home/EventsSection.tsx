'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { EventCard } from './EventCard'
import { EventsCalendar } from './EventsCalendar'
import { EventsSkeleton } from '../skeletons'
import styles from './EventsSection.module.css'

interface Event {
  id: number
  title: string
  description: string
  game: string | null
  event_date: string | null
  telegram_url: string | null
  status: string
  max_participants: number | null
  registration_enabled: boolean
  registered_count: number
  is_registered: boolean
  can_register: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function EventsSection() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list')
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    // Проверяем токен
    const storedToken = localStorage.getItem('lesnaya_token')
    setToken(storedToken)
    fetchEvents(storedToken)
  }, [])

  const fetchEvents = async (authToken: string | null) => {
    try {
      setLoading(true)
      setError(null)
      
      const headers = authToken ? { Authorization: `Bearer ${authToken}` } : {}
      const response = await axios.get<Event[]>(`${API_URL}/api/events/`, { headers })
      
      setEvents(response.data)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Не удалось загрузить события')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (eventId: number) => {
    if (!token) {
      alert('Войдите через Discord чтобы зарегистрироваться')
      return
    }

    try {
      await axios.post(
        `${API_URL}/api/events/register`,
        { event_id: eventId },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Обновляем список событий
      fetchEvents(token)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Ошибка регистрации'
      alert(message)
    }
  }

  const handleUnregister = async (eventId: number) => {
    if (!token) return

    try {
      await axios.delete(
        `${API_URL}/api/events/register/${eventId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Обновляем список событий
      fetchEvents(token)
    } catch (err: any) {
      const message = err.response?.data?.detail || 'Ошибка отмены регистрации'
      alert(message)
    }
  }

  const handleEventClick = (event: Event) => {
    if (event.telegram_url) {
      window.open(event.telegram_url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleCalendarEventClick = (eventId: number) => {
    const event = events.find(e => e.id === eventId)
    if (event) {
      handleEventClick(event)
    }
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h2 className={styles.title}>
              📅 События
            </h2>
            <p className={styles.subtitle}>Турниры и мероприятия лесной команды</p>
          </header>
          <EventsSkeleton />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.error}>{error}</div>
        </div>
      </section>
    )
  }

  if (events.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h2 className={styles.title}>
              📅 События
            </h2>
            <p className={styles.subtitle}>Турниры и мероприятия лесной команды</p>
          </header>
          <div className={styles.empty}>
            <p>Событий пока нет</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className={styles.section}>
      <div className={styles.container}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.title}>
              📅 События
            </h2>
            <p className={styles.subtitle}>Турниры и мероприятия лесной команды</p>
          </div>
          <div className={styles.viewToggle}>
            <button
              className={viewMode === 'list' ? styles.active : ''}
              onClick={() => setViewMode('list')}
            >
              📋 Список
            </button>
            <button
              className={viewMode === 'calendar' ? styles.active : ''}
              onClick={() => setViewMode('calendar')}
            >
              📅 Календарь
            </button>
          </div>
        </header>

        {viewMode === 'calendar' ? (
          <EventsCalendar onEventClick={handleCalendarEventClick} />
        ) : (
          <div className={styles.grid}>
            {events.map((event) => (
              <EventCard
                key={event.id}
                {...event}
                onClick={() => handleEventClick(event)}
                onRegister={event.can_register && !event.is_registered ? () => handleRegister(event.id) : undefined}
                onUnregister={event.is_registered ? () => handleUnregister(event.id) : undefined}
                isAuthenticated={!!token}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
