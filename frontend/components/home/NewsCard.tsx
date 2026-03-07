import { useState } from 'react'
import styles from './NewsCard.module.css'

interface NewsCardProps {
  id: number
  title: string
  content: string
  image_url: string | null
  created_at: string
  onClick: () => void
}

export function NewsCard({ title, content, image_url, created_at, onClick }: NewsCardProps) {
  const [imageError, setImageError] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  return (
    <article className={styles.card} onClick={onClick}>
      <div className={styles.imageContainer}>
        {image_url && !imageError ? (
          <img
            src={image_url}
            alt={title}
            className={styles.image}
            loading="lazy"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className={styles.noImage}>📰</div>
        )}
      </div>
      <div className={styles.content}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.description}>{content}</p>
        <div className={styles.footer}>
          <span className={styles.date}>{formatDate(created_at)}</span>
          <span className={styles.readMore}>
            Читать далее →
          </span>
        </div>
      </div>
    </article>
  )
}
