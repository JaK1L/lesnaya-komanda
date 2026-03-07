'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { NewsCard } from './NewsCard'
import { NewsModal } from './NewsModal'
import styles from './NewsSection.module.css'

interface News {
  id: number
  title: string
  content: string
  image_url: string | null
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function NewsSection() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNews, setSelectedNews] = useState<News | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  useEffect(() => {
    fetchNews()
  }, [])

  const fetchNews = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<News[]>(`${API_URL}/api/news`)
      setNews(response.data)
    } catch (err) {
      console.error('Error fetching news:', err)
      setError('Не удалось загрузить новости')
    } finally {
      setLoading(false)
    }
  }

  const handleNewsClick = (newsItem: News) => {
    setSelectedNews(newsItem)
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedNews(null), 300)
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <div className={styles.loading}>Загрузка новостей...</div>
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

  if (news.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h2 className={styles.title}>
              📰 Новости
            </h2>
            <p className={styles.subtitle}>Последние новости лесной команды</p>
          </header>
          <div className={styles.empty}>
            <p>Новостей пока нет</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className={styles.section}>
        <div className={styles.container}>
          <header className={styles.header}>
            <h2 className={styles.title}>
              📰 Новости
            </h2>
            <p className={styles.subtitle}>Последние новости лесной команды</p>
          </header>

          <div className={styles.grid}>
            {news.map((item) => (
              <NewsCard
                key={item.id}
                {...item}
                onClick={() => handleNewsClick(item)}
              />
            ))}
          </div>
        </div>
      </section>

      <NewsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        news={selectedNews}
      />
    </>
  )
}
