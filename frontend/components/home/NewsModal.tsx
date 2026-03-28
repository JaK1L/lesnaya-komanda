'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import axios from 'axios'
import { CornerDownRight } from 'lucide-react'
import { getImageUrl } from '../../lib/imageUtils'
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

interface CommentItem {
  id: number
  user_id: number
  user_name: string
  user_avatar_url: string | null
  user_profile_identifier: string | null
  content: string
  parent_comment_id: number | null
  created_at: string
  replies: CommentItem[]
}

const RIGHT_PANEL_W = 380
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function NewsModal({ isOpen, onClose, news }: NewsModalProps) {
  const [likes, setLikes] = useState(0)
  const [dislikes, setDislikes] = useState(0)
  const [userReaction, setUserReaction] = useState<'like' | 'dislike' | null>(null)
  const [comments, setComments] = useState<CommentItem[]>([])
  const [newComment, setNewComment] = useState('')
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [imgSize, setImgSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    setIsAuthenticated(!!localStorage.getItem('lesnaya_token'))
  }, [])

  useEffect(() => {
    setImgSize(null)
    setReplyTo(null)
    setNewComment('')
  }, [news?.id])

  useEffect(() => {
    if (isOpen && news) {
      void loadReactions()
      void loadComments()
    }
  }, [isOpen, news])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, onClose])

  const formatDate = useCallback(
    (value: string, mode: 'date' | 'datetime' = 'date') =>
      new Date(value)[mode === 'date' ? 'toLocaleDateString' : 'toLocaleString']('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: mode === 'datetime' ? '2-digit' : undefined,
        minute: mode === 'datetime' ? '2-digit' : undefined,
      }),
    [],
  )

  const initials = useCallback((name: string) => name.trim().slice(0, 2).toUpperCase(), [])

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
      const res = await axios.get<CommentItem[]>(`${API_URL}/api/news/${news.id}/comments`)
      setComments(res.data || [])
    } catch {}
  }

  const handleReaction = async (type: 'like' | 'dislike') => {
    if (!news || !isAuthenticated) return
    const token = localStorage.getItem('lesnaya_token')
    if (!token) return

    try {
      await axios.post(
        `${API_URL}/api/news/${news.id}/react`,
        { reaction: type },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      if (userReaction === type) {
        setUserReaction(null)
        type === 'like' ? setLikes((v) => v - 1) : setDislikes((v) => v - 1)
      } else {
        if (userReaction === 'like') setLikes((v) => v - 1)
        if (userReaction === 'dislike') setDislikes((v) => v - 1)
        setUserReaction(type)
        type === 'like' ? setLikes((v) => v + 1) : setDislikes((v) => v + 1)
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
      await axios.post(
        `${API_URL}/api/news/${news.id}/comments`,
        { content: newComment, parent_comment_id: replyTo?.id ?? null },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setNewComment('')
      setReplyTo(null)
      await loadComments()
    } catch {
    } finally {
      setIsSubmitting(false)
    }
  }

  const computeLayout = useCallback((natW: number, natH: number) => {
    const vw = window.innerWidth
    const vh = window.innerHeight
    const maxH = Math.min(vh * 0.9, 860)
    const maxImgW = Math.min(vw * 0.9, 1200) - RIGHT_PANEL_W

    let imgW = natW
    let imgH = natH

    if (imgH > maxH) {
      imgW *= maxH / imgH
      imgH = maxH
    }
    if (imgW > maxImgW) {
      imgH *= maxImgW / imgW
      imgW = maxImgW
    }
    if (imgW < 300) {
      imgH *= 300 / imgW
      imgW = 300
    }

    setImgSize({ w: Math.round(imgW), h: Math.round(imgH) })
  }, [])

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget
    computeLayout(img.naturalWidth, img.naturalHeight)
  }

  const renderComment = (comment: CommentItem, depth = 0) => {
    const profileHref = comment.user_profile_identifier
      ? `/profile/${encodeURIComponent(comment.user_profile_identifier)}`
      : null

    return (
      <div key={comment.id} className={styles.commentThread}>
        <div className={styles.comment} style={{ marginLeft: depth > 0 ? Math.min(depth, 3) * 18 : 0 }}>
          {profileHref ? (
            <Link href={profileHref} className={styles.commentAvatarLink}>
              {comment.user_avatar_url ? (
                <img
                  src={getImageUrl(comment.user_avatar_url) || ''}
                  alt={comment.user_name}
                  className={styles.commentAvatarImage}
                />
              ) : (
                <div className={styles.commentAvatar}>{initials(comment.user_name)}</div>
              )}
            </Link>
          ) : (
            comment.user_avatar_url ? (
              <img src={getImageUrl(comment.user_avatar_url) || ''} alt={comment.user_name} className={styles.commentAvatarImage} />
            ) : (
              <div className={styles.commentAvatar}>{initials(comment.user_name)}</div>
            )
          )}
          <div className={styles.commentBody}>
            <div className={styles.commentHeader}>
              {profileHref ? (
                <Link href={profileHref} className={styles.commentAuthorLink}>
                  {comment.user_name}
                </Link>
              ) : (
                <span className={styles.commentAuthor}>{comment.user_name}</span>
              )}
              <span className={styles.commentDate}>{formatDate(comment.created_at, 'datetime')}</span>
            </div>
            <p className={styles.commentContent}>{comment.content}</p>
            {isAuthenticated && (
              <button
                type="button"
                className={styles.replyButton}
                onClick={() => {
                  setReplyTo(comment)
                  setNewComment(`@${comment.user_name}, `)
                }}
              >
                <CornerDownRight size={14} />
                Ответить
              </button>
            )}
          </div>
        </div>
        {comment.replies?.length > 0 && (
          <div className={styles.replyList}>
            {comment.replies.map((reply) => renderComment(reply, depth + 1))}
          </div>
        )}
      </div>
    )
  }

  const hasImage = !!news?.image_url
  const modalStyle = hasImage && imgSize ? { width: imgSize.w + RIGHT_PANEL_W, height: imgSize.h } : undefined
  const imagePanelStyle = hasImage && imgSize ? { width: imgSize.w, height: imgSize.h, flex: 'none' } : undefined
  const replyTitle = useMemo(() => (replyTo ? `Ответ для ${replyTo.user_name}` : null), [replyTo])

  if (!isOpen || !news) return null

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`${styles.modal} ${!hasImage ? styles.modalNoImage : ''}`} style={modalStyle}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Закрыть">×</button>

        {hasImage && (
          <div className={styles.imagePanel} style={imagePanelStyle}>
            <img
              src={getImageUrl(news.image_url!) || news.image_url!}
              alt={news.title}
              onLoad={handleImageLoad}
              className={imgSize ? styles.imgLoaded : styles.imgLoading}
            />
          </div>
        )}

        <div className={styles.rightPanel}>
          <div className={styles.rightHeader}>
            <h2 className={styles.title}>{news.title}</h2>
            <div className={styles.meta}>
              <span className={styles.date}>{formatDate(news.created_at)}</span>
              {news.tags?.length > 0 && (
                <div className={styles.tags}>
                  {news.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>{tag}</span>
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
                  {replyTitle && (
                    <div className={styles.replyTarget}>
                      <span>{replyTitle}</span>
                      <button type="button" className={styles.replyCancel} onClick={() => { setReplyTo(null); setNewComment('') }}>
                        Отменить
                      </button>
                    </div>
                  )}
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder={replyTo ? 'Напиши ответ...' : 'Написать комментарий...'}
                    className={styles.commentInput}
                    rows={replyTo ? 3 : 2}
                    disabled={isSubmitting}
                  />
                  <button type="submit" className={styles.commentSubmit} disabled={!newComment.trim() || isSubmitting}>
                    {isSubmitting ? 'Отправка...' : (replyTo ? 'Ответить' : 'Отправить')}
                  </button>
                </form>
              ) : (
                <p className={styles.authPrompt}>Войдите, чтобы оставить комментарий</p>
              )}

              <div className={styles.commentsList}>
                {comments.length > 0 ? comments.map((comment) => renderComment(comment)) : (
                  <p className={styles.authPrompt}>Комментариев пока нет. Будь первым.</p>
                )}
              </div>
            </div>
          </div>

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
