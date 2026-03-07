'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import styles from './EventsCalendar.module.css'

interface CalendarEvent {
  id: number
  title: string
  game: string | null
  time: string
  status: string
  registered_count: number
}

interface CalendarData {
  year: number
  month: number
  events: Record<number, CalendarEvent[]>
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const MONTH_NAMES = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
]

const WEEKDAY_NAMES = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']

export function EventsCalendar({ onEventClick }: { onEventClick?: (eventId: number) => void }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [calendarData, setCalendarData] = useState<CalendarData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadCalendar()
  }, [currentDate])

  const loadCalendar = async () => {
    try {
      setLoading(true)
      const year = currentDate.getFullYear()
      const month = currentDate.getMonth() + 1

      const response = await axios.get<CalendarData>(
        `${API_URL}/api/events/calendar?year=${year}&month=${month}`
      )
      setCalendarData(response.data)
    } catch (err) {
      console.error('Error loading calendar:', err)
    } finally {
      setLoading(false)
    }
  }

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    return new Date(year, month + 1, 0).getDate()
  }

  const getFirstDayOfMonth = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const day = new Date(year, month, 1).getDay()
    // Преобразуем воскресенье (0) в 7
    return day === 0 ? 7 : day
  }

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))
  }

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth()
    const firstDay = getFirstDayOfMonth()
    const days = []

    // Пустые ячейки до первого дня месяца
    for (let i = 1; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className={styles.emptyDay} />)
    }

    // Дни месяца
    for (let day = 1; day <= daysInMonth; day++) {
      const dayEvents = calendarData?.events[day] || []
      const isToday = 
        day === new Date().getDate() &&
        currentDate.getMonth() === new Date().getMonth() &&
        currentDate.getFullYear() === new Date().getFullYear()

      days.push(
        <div
          key={day}
          className={`${styles.day} ${isToday ? styles.today : ''} ${dayEvents.length > 0 ? styles.hasEvents : ''}`}
        >
          <div className={styles.dayNumber}>{day}</div>
          {dayEvents.length > 0 && (
            <div className={styles.dayEvents}>
              {dayEvents.map((event) => (
                <div
                  key={event.id}
                  className={styles.eventDot}
                  title={`${event.time} - ${event.title}`}
                  onClick={() => onEventClick?.(event.id)}
                >
                  <span className={styles.eventTime}>{event.time}</span>
                  <span className={styles.eventTitle}>{event.title}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )
    }

    return days
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка календаря...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button onClick={previousMonth} className={styles.navButton}>
          ←
        </button>
        <h3 className={styles.monthTitle}>
          {MONTH_NAMES[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h3>
        <button onClick={nextMonth} className={styles.navButton}>
          →
        </button>
      </div>

      <div className={styles.weekdays}>
        {WEEKDAY_NAMES.map((day) => (
          <div key={day} className={styles.weekday}>
            {day}
          </div>
        ))}
      </div>

      <div className={styles.calendar}>
        {renderCalendar()}
      </div>
    </div>
  )
}
