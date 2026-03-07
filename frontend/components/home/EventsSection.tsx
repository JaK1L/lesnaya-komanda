'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { EventCard } from './EventCard'
import styles from './EventsSection.module.css'

interface Event {
  id: number
  title: string
  description: string
  game: string | null
  event_date: string | null
  telegram_url: string | null
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function EventsSection() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchEvents()
  }, [])

  const fetchEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<Event[]>(`${API_URL}/api/events`)
      // Бэкенд уже фильтрует по expires_at, просто показываем все что пришло
      setEvents(response.data)
    } catch (err) {
      console.error('Error fetching events:', err)
      setError('Не удалось загрузить события')
    } finally {
      setLoading(false)
    }
  }

  const handleEventClick = (event: Event) => {
    if (event.telegram_url) {
      window.open(event.telegram_url, '_blank', 'noopener,noreferrer')
    }
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка событий...</div>
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
          <h2 className={styles.title}>
            📅 События
          </h2>
          <p className={styles.subtitle}>Турниры и мероприятия лесной команды</p>
        </header>

        <div className={styles.grid}>
          {events.map((item) => (
            <EventCard
              key={item.id}
              {...item}
              onClick={() => handleEventClick(item)}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
