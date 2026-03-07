'use client'

import { useMemo, memo, useCallback } from 'react'
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

// Анимация контейнера с stagger
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
    },
  },
}

// Анимация карточки
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

// Мемоизированная карточка новости
const NewsCard = memo(function NewsCard({ 
  item,
  dateLabel
}: { 
  item: FeedItem
  dateLabel: string
}) {
  return (
    <motion.div 
      variants={cardVariants}
      whileHover={{ 
        y: -8,
        transition: { duration: 0.2 }
      }}
    >
      <div className={styles.newsCard}>
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
        >
          <div className={styles.date}>{dateLabel}</div>
        </motion.div>
        
        <div className={styles.newsTitle}>{item.title}</div>
        
        {item.content && (
          <div className={styles.content}>{item.content}</div>
        )}
        
        <Button size="small">КУПИТЬ</Button>
      </div>
    </motion.div>
  )
})

// Дефолтные новости (вынесены наружу, чтобы не создавать каждый раз)
const DEFAULT_NEWS: FeedItem[] = [
  { id: 1, title: 'ХУДИ LESNAYA', content: '4 500 ₽', created_at: new Date().toISOString() },
  { id: 2, title: 'ФУТБОЛКА CYBER FOREST', content: '2 500 ₽', created_at: new Date().toISOString() },
  { id: 3, title: 'КРУЖКА DRUID MODE', content: '1 000 ₽', created_at: new Date().toISOString() },
]

export const NewsSection = memo(function NewsSection({ posts }: NewsSectionProps) {
  // Мемоизируем отображаемые посты
  const newsToShow = useMemo(() => {
    const displayPosts = posts.slice(0, 3)
    return displayPosts.length > 0 ? displayPosts : DEFAULT_NEWS
  }, [posts])

  // Мемоизируем функцию форматирования даты
  const formatDate = useCallback((dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  }, [])

  return (
    <section id="news" className={styles.section}>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
      >
        <h2 className={styles.title}>НОВОСТИ</h2>
      </motion.div>
      
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-100px" }}
      >
        <div className={styles.grid}>
          {newsToShow.map((item) => (
            <NewsCard
              key={item.id}
              item={item}
              dateLabel={formatDate(item.created_at)}
            />
          ))}
        </div>
      </motion.div>
    </section>
  )
})
