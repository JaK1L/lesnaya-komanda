import { useEffect } from 'react'
import styles from './NewsModal.module.css'

interface NewsModalProps {
  isOpen: boolean
  onClose: () => void
  news: {
    id: number
    title: string
    content: string
    image_url: string | null
    created_at: string
  } | null
}

export function NewsModal({ isOpen, onClose, news }: NewsModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
    }

    return () => {
      window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen || !news) return null

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Закрыть"
        >
          ×
        </button>

        {news.image_url && (
          <div className={styles.imageContainer}>
            <img
              src={news.image_url}
              alt={news.title}
              className={styles.image}
            />
          </div>
        )}

        <div className={styles.content}>
          <header className={styles.header}>
            <h2 className={styles.title}>{news.title}</h2>
            <div className={styles.date}>
              📅 {formatDate(news.created_at)}
            </div>
          </header>

          <div className={styles.body}>
            {news.content}
          </div>
        </div>
      </div>
    </div>
  )
}
