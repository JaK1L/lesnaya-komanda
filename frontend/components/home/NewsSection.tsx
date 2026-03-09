'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
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

// Анимация контейнера
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
}

// Анимация карточки
const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

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
      setNews(response.data.slice(0, 2)) // Показываем только 2 новости
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

  // Функция для обрезки текста
  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Последние новости</h2>
        <div className={styles.grid}>
          {[1, 2].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.skeleton}></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || news.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Последние новости</h2>
        <div className={styles.emptyState}>
          <p>Новостей пока нет</p>
        </div>
      </section>
    )
  }

  return (
    <>
      <section className={styles.section}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className={styles.title}>Последние новости</h2>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
        >
          <div className={styles.grid}>
            {news.map((item) => (
              <motion.div
                key={item.id}
                variants={cardVariants}
                whileHover={{ 
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
              >
                <div 
                  className={styles.card}
                  onClick={() => handleNewsClick(item)}
                >
                  <h3 className={styles.cardTitle}>{item.title}</h3>
                  <p className={styles.cardContent}>
                    {truncateText(item.content, 100)}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      <NewsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        news={selectedNews}
      />
    </>
  )
}
