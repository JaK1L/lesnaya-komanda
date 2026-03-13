'use client'

import { useEffect, useState, useCallback } from 'react'
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

const RIGHT_PANEL_W = 380
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function NewsModal({ isOpen, onClose, news }: NewsModalProps) {
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('lesnaya_token'))
  }, [])

  // Reset image size when news changes
  useEffect(() => {
    setImgSize(null)
  }, [news?.id])

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

  // Compute modal & image panel dimensions based on natural image size
  const computeLayout = useCallback((natW: number, natH: number) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxH = Math.min(vh * 0.9, 860)
    const maxImgW = Math.min(vw * 0.9, 1200) - RIGHT_PANEL_W

    let imgW = natW
    let imgH = natH

    // Scale down to fit height
    if (imgH > maxH) {
      imgW = imgW * (maxH / imgH)
      imgH = maxH
    }
    // Scale down to fit max width
    if (imgW > maxImgW) {
      imgH = imgH * (maxImgW / imgW)
      imgW = maxImgW
    }
    // Scale up tiny images to at least 300px wide
    if (imgW < 300) {
      imgH = imgH * (300 / imgW)
      imgW = 300
    }

    setImgSize({ w: Math.round(imgW), h: Math.round(imgH) })
  }, [])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    computeLayout(img.naturalWidth, img.naturalHeight)
  }

  if (!isOpen || !news) return null

  const formatDate = (s: string) =>
    new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })

  const initials = (name: string) => name.slice(0, 2).toUpperCase()

  const hasImage = !!news.image_url

  // Dynamic modal style when image dimensions are known
  const modalStyle = hasImage && imgSize
    ? { width: imgSize.w + RIGHT_PANEL_W, height: imgSize.h }
    : undefined

  const imagePanelStyle = hasImage && imgSize
    ? { width: imgSize.w, height: imgSize.h, flex: 'none' }
    : undefined

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={`${styles.modal} ${!hasImage ? styles.modalNoImage : ''}`}
        style={modalStyle}
      >
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">×</button>

        {/* Left: image */}
        {hasImage && (
          <div className={styles.imagePanel} style={imagePanelStyle}>
            <img
              src={news.image_url!}
              alt={news.title}
              onLoad={handleImageLoad}
              className={imgSize ? styles.imgLoaded : styles.imgLoading}
            />
          </div>
        )}

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
