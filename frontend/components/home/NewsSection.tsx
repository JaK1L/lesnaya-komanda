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
  tags: string[]
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const SCROLL_STEP = 450

export function NewsSection() {
  const [news, setNews] = useState<News[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNews, setSelectedNews] = useState<News | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)

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

  const scroll = (dir: 'prev' | 'next') => {
    if (!trackRef.current) return
    trackRef.current.scrollBy({
      left: dir === 'next' ? SCROLL_STEP : -SCROLL_STEP,
      behavior: 'smooth',
    })
  }

  const truncateText = (text: string, maxLength: number) => {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
  }

  if (loading) {
    return (
      <section className={styles.section}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Новости</h2>
          <p className={styles.sectionSubtitle}>Отборные новости для наших последователей</p>
        </div>
        <div className={styles.scrollTrack}>
          {[1, 2, 3].map((i) => (
            <div key={i} className={styles.card}>
              <div className={styles.cardImage}>
                <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }}></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className={styles.section} id="news">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Новости</h2>
          <p className={styles.sectionSubtitle}>Отборные новости для наших последователей</p>
        </div>
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem 0',
          color: 'var(--color-white-64)' 
        }}>
          {error}
        </div>
      </section>
    )
  }

  return (
    <>
      <section className={styles.section} id="news">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Новости</h2>
          <p className={styles.sectionSubtitle}>Отборные новости для наших последователей</p>
        </div>

        <div className={styles.scrollWrapper}>
          <div className={styles.scrollTrack} ref={trackRef}>
            {news.length > 0 ? news.map((article) => (
              <article
                key={article.id}
                className={styles.card}
                onClick={() => handleNewsClick(article)}
              >
                <div className={styles.cardImage}>
                  {article.image_url ? (
                    <img
                      src={article.image_url}
                      alt={article.title}
                      className={styles.cardImg}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }}></div>
                  )}
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{article.title}</h3>
                  <p className={styles.cardText}>{truncateText(article.content, 120)}</p>
                </div>

                {article.tags && article.tags.length > 0 && (
                  <div className={styles.tags}>
                    {article.tags.map((tag) => (
                      <span key={tag} className={styles.tagDefault}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            )) : (
              <div style={{ 
                width: '100%',
                textAlign: 'center', 
                padding: '3rem 0',
                color: 'var(--color-white-64)' 
              }}>
                Новостей пока нет
              </div>
            )}
          </div>

          <div className={styles.fadeRight} aria-hidden="true" />

          <button
            className={`${styles.navBtn} ${styles.navBtnPrev}`}
            onClick={() => scroll('prev')}
            aria-label="Предыдущие новости"
          >
            ←
          </button>

          <button
            className={`${styles.navBtn} ${styles.navBtnNext}`}
            onClick={() => scroll('next')}
            aria-label="Следующие новости"
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
