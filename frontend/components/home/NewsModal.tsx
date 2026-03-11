'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import styles from './NewsModal.module.css'

interface NewsModalProps {
  isOpen: boolean
  onClose: () => void
  news: {
    id: number
    title: string
    content: string
    image_url: string | null
    tags: string[]
    created_at: string
  } | null
}

interface Comment {
  id: number
  user_name: string
  content: string
  created_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function NewsModal({ isOpen, onClose, news }: NewsModalProps) {
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('lesnaya_token')
    setIsAuthenticated(!!token)
  }, [])

  useEffect(() => {
    if (isOpen && news) {
      loadReactions()
      loadComments()
    }
  }, [isOpen, news])

  const loadReactions = async () => {
    if (!news) return
    try {
      const response = await axios.get(`${API_URL}/api/news/${news.id}/reactions`)
      setLikes(response.data.likes || 0)
      setDislikes(response.data.dislikes || 0)
      setUserReaction(response.data.user_reaction || null)
    } catch (err) {
      console.error('Error loading reactions:', err)
    }
  }

  const loadComments = async () => {
    if (!news) return
    try {
      const response = await axios.get(`${API_URL}/api/news/${news.id}/comments`)
      setComments(response.data || [])
    } catch (err) {
      console.error('Error loading comments:', err)
    }
  }

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!news || !isAuthenticated) return

    const token = localStorage.getItem('lesnaya_token')
    if (!token) return

    try {
      await axios.post(
        `${API_URL}/api/news/${news.id}/react`,
        { reaction: type },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      // Обновляем локально
      if (userReaction === type) {
        // Убираем реакцию
        setUserReaction(null)
        if (type === 'like') setLikes(likes - 1)
        else setDislikes(dislikes - 1)
      } else {
        // Меняем реакцию
        if (userReaction === 'like') setLikes(likes - 1)
        if (userReaction === 'dislike') setDislikes(dislikes - 1)
        
        setUserReaction(type)
        if (type === 'like') setLikes(likes + 1)
        else setDislikes(dislikes + 1)
      }
    } catch (err) {
      console.error('Error reacting:', err)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!news || !newComment.trim() || !isAuthenticated) return

    const token = localStorage.getItem('lesnaya_token')
    if (!token) return

    setIsSubmitting(true)
    try {
      await axios.post(
        `${API_URL}/api/news/${news.id}/comments`,
        { content: newComment },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setNewComment('')
      loadComments()
    } catch (err) {
      console.error('Error posting comment:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

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

          {news.tags && Array.isArray(news.tags) && news.tags.length > 0 && (
            <div className={styles.tags}>
              {news.tags.map((tag, index) => (
                <span key={`${tag}-${index}`} className={styles.tag}>
                  {typeof tag === 'string' ? tag : String(tag)}
                </span>
              ))}
            </div>
          )}

          <div className={styles.body}>
            {news.content}
          </div>

          {/* Reactions */}
          <div className={styles.reactions}>
            <button
              className={`${styles.reactionButton} ${userReaction === 'like' ? styles.active : ''}`}
              onClick={() => handleReaction('like')}
              disabled={!isAuthenticated}
            >
              👍 {likes}
            </button>
            <button
              className={`${styles.reactionButton} ${userReaction === 'dislike' ? styles.active : ''}`}
              onClick={() => handleReaction('dislike')}
              disabled={!isAuthenticated}
            >
              👎 {dislikes}
            </button>
          </div>

          {/* Comments */}
          <div className={styles.commentsSection}>
            <h3 className={styles.commentsTitle}>
              Комментарии ({comments.length})
            </h3>

            {isAuthenticated ? (
              <form onSubmit={handleSubmitComment} className={styles.commentForm}>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Написать комментарий..."
                  className={styles.commentInput}
                  rows={3}
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  className={styles.commentSubmit}
                  disabled={!newComment.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Отправка...' : 'Отправить'}
                </button>
              </form>
            ) : (
              <p className={styles.authPrompt}>
                Войдите, чтобы оставить комментарий
              </p>
            )}

            <div className={styles.commentsList}>
              {comments.map((comment) => (
                <div key={comment.id} className={styles.comment}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>{comment.user_name}</span>
                    <span className={styles.commentDate}>
                      {formatDate(comment.created_at)}
                    </span>
                  </div>
                  <p className={styles.commentContent}>{comment.content}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
