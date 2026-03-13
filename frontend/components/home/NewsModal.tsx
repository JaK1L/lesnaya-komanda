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
    setIsAuthenticated(!!localStorage.getItem('lesnaya_token'))
  }, [])

  useEffect(() => {
    if (isOpen && news) {
      loadReactions()
      loadComments()
    }
  }, [isOpen, news])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => { document.body.style.overflow = 'unset' }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const loadReactions = async () => {
    if (!news) return
    try {
      const res = await axios.get(`${API_URL}/api/news/${news.id}/reactions`)
      setLikes(res.data.likes || 0)
      setDislikes(res.data.dislikes || 0)
      setUserReaction(res.data.user_reaction || null)
    } catch {}
  }

  const loadComments = async () => {
    if (!news) return
    try {
      const res = await axios.get(`${API_URL}/api/news/${news.id}/comments`)
      setComments(res.data || [])
    } catch {}
  }

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!news || !isAuthenticated) return
    const token = localStorage.getItem('lesnaya_token')
    if (!token) return
    try {
      await axios.post(`${API_URL}/api/news/${news.id}/react`, { reaction: type }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (userReaction === type) {
        setUserReaction(null)
        type === 'like' ? setLikes(l => l - 1) : setDislikes(d => d - 1)
      } else {
        if (userReaction === 'like') setLikes(l => l - 1)
        if (userReaction === 'dislike') setDislikes(d => d - 1)
        setUserReaction(type)
        type === 'like' ? setLikes(l => l + 1) : setDislikes(d => d + 1)
      }
    } catch {}
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!news || !newComment.trim() || !isAuthenticated) return
    const token = localStorage.getItem('lesnaya_token')
    if (!token) return
    setIsSubmitting(true)
    try {
      await axios.post(`${API_URL}/api/news/${news.id}/comments`, { content: newComment }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNewComment('')
      loadComments()
    } catch {} finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen || !news) return null

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  const initials = (name: string) => name.slice(0, 2).toUpperCase()

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">×</button>

        {/* Left: image */}
        <div className={styles.imagePanel}>
          {news.image_url
            ? <img src={news.image_url} alt={news.title} />
            : <div className={styles.imagePlaceholder}>📰</div>
          }
        </div>

        {/* Right: content */}
        <div className={styles.rightPanel}>
          <div className={styles.rightHeader}>
            <h2 className={styles.title}>{news.title}</h2>
            <div className={styles.meta}>
              <span className={styles.date}>{formatDate(news.created_at)}</span>
              {news.tags?.length > 0 && (
                <div className={styles.tags}>
                  {news.tags.map((tag, i) => (
                    <span key={i} className={styles.tag}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className={styles.scrollable}>
            <p className={styles.body}>{news.content}</p>

            <div className={styles.commentsSection}>
              <p className={styles.commentsTitle}>Комментарии ({comments.length})</p>

              {isAuthenticated ? (
                <form onSubmit={handleSubmitComment} className={styles.commentForm}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Написать комментарий..."
                    className={styles.commentInput}
                    rows={2}
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
                <p className={styles.authPrompt}>Войдите, чтобы оставить комментарий</p>
              )}

              <div className={styles.commentsList}>
                {comments.map((c) => (
                  <div key={c.id} className={styles.comment}>
                    <div className={styles.commentAvatar}>{initials(c.user_name)}</div>
                    <div className={styles.commentBody}>
                      <span className={styles.commentAuthor}>{c.user_name}</span>
                      <span className={styles.commentDate}>{formatDate(c.created_at)}</span>
                      <p className={styles.commentContent}>{c.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Reactions pinned at bottom */}
          <div className={styles.reactions}>
            <button
              className={`${styles.reactionBtn} ${userReaction === 'like' ? styles.active : ''}`}
              onClick={() => handleReaction('like')}
              disabled={!isAuthenticated}
            >
              👍 {likes}
            </button>
            <button
              className={`${styles.reactionBtn} ${userReaction === 'dislike' ? styles.active : ''}`}
              onClick={() => handleReaction('dislike')}
              disabled={!isAuthenticated}
            >
              👎 {dislikes}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
