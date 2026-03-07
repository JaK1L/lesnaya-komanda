'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/Button/Button'
import styles from './NewsSection.module.css'

interface FeedItem {
  id: number
  title: string
  content: string | null
  created_at: string
}

interface NewsSectionProps {
  posts: FeedItem[]
}

export function NewsSection({ posts }: NewsSectionProps) {
  const displayPosts = posts.slice(0, 3)

  // Дефолтные новости если база пуста
  const defaultNews = [
    { id: 1, title: 'ХУДИ LESNAYA', content: '4 500 ₽', created_at: new Date().toISOString() },
    { id: 2, title: 'ФУТБОЛКА CYBER FOREST', content: '2 500 ₽', created_at: new Date().toISOString() },
    { id: 3, title: 'КРУЖКА DRUID MODE', content: '1 000 ₽', created_at: new Date().toISOString() },
  ]

  const newsToShow = displayPosts.length > 0 ? displayPosts : defaultNews

  return (
    <section id="news" className={styles.section}>
      <h2 className={styles.title}>НОВОСТИ</h2>
      
      <div className={styles.grid}>
        {newsToShow.map((item, index) => {
          const dateLabel = new Date(item.created_at).toLocaleString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          })

          return (
            <div key={item.id} className={styles.newsCard}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                viewport={{ once: true }}
                style={{ width: '100%' }}
              >
                <div className={styles.date}>{dateLabel}</div>
                <div className={styles.newsTitle}>{item.title}</div>
                {item.content && (
                  <div className={styles.content}>{item.content}</div>
                )}
                <Button size="small">КУПИТЬ</Button>
              </motion.div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
