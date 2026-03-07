'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { FeedCard } from './FeedCard'
import styles from './FeedSection.module.css'

interface FeedItem {
  id: number
  kind: string
  title: string
  content: string | null
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function FeedSection() {
  const [feed, setFeed] = useState<FeedItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchFeed()
  }, [])

  const fetchFeed = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<FeedItem[]>(`${API_URL}/api/feed`)
      // Показываем последние 10 записей
      setFeed(response.data.slice(0, 10))
    } catch (err) {
      console.error('Error fetching feed:', err)
      setError('Не удалось загрузить ленту')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка ленты...</div>
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

  if (feed.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h2 className={styles.title}>
              📋 Лента
            </h2>
            <p className={styles.subtitle}>Достижения и новости команды</p>
          </header>
          <div className={styles.empty}>
            <p>Записей пока нет</p>
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
            📋 Лента
          </h2>
          <p className={styles.subtitle}>Достижения и новости команды</p>
        </header>

        <div className={styles.feedList}>
          {feed.map((item) => (
            <FeedCard key={item.id} {...item} />
          ))}
        </div>
      </div>
    </section>
  )
}
