'use client'

import { useEffect, useState, useRef } from 'react'
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

export function NewsSection() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNews, setSelectedNews] = useState<News | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

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

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -450, behavior: 'smooth' })
    }
  }

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 450, behavior: 'smooth' })
    }
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Последние новости</h2>
          <p>Будьте в курсе всех событий</p>
        </div>
        <div className={styles.newsScroll}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.newsCard}>
              <div style={{ width: '100%', height: '200px', background: '#2a2a2a' }}></div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error || news.length === 0) {
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2>Последние новости</h2>
          <p>Будьте в курсе всех событий</p>
        </div>
        <p style={{ color: 'var(--white64)' }}>Новостей пока нет</p>
      </section>
    )
  }

  return (
    <>
      <section className={styles.section} id="news">
        <div className={styles.sectionHeader}>
          <h2>Новости</h2>
          <p>Отборные новости для наших последователей</p>
        </div>

        <div className={styles.newsWrapper}>
          <button 
            className={`${styles.newsNav} ${styles.newsNavPrev}`}
            onClick={scrollLeft}
            aria-label="Предыдущая новость"
          >
            ←
          </button>

          <div className={styles.newsScroll} ref={scrollRef}>
            {news.map((item) => (
              <div 
                key={item.id}
                className={styles.newsCard}
                onClick={() => handleNewsClick(item)}
              >
                <div className={styles.newsCardImg}>
                  {item.image_url ? (
                    <img 
                      src={item.image_url} 
                      alt={item.title}
                    />
                  ) : (
                    <div className={styles.newsCardImgPlaceholder} />
                  )}
                </div>
                <div className={styles.newsCardBody}>
                  <h3>{item.title}</h3>
                  <p>{truncateText(item.content, 120)}</p>
                  <div className={styles.newsCardTags}>
                    <span className={styles.tagDota}>Легендарный момент</span>
                    <span className={styles.tagTwitch}>Dota</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className={styles.newsFadeLeft}></div>
          <div className={styles.newsFadeRight}></div>

          <button 
            className={`${styles.newsNav} ${styles.newsNavNext}`}
            onClick={scrollRight}
            aria-label="Следующая новость"
          >
            →
          </button>
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
