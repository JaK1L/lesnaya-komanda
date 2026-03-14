'use client'

import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Upload, X, Image as ImageIcon, Film, Link } from 'lucide-react'
import { Navigation } from '../../components/layout/Navigation'
import { Footer } from '../../components/layout/Footer'
import { uploadImage } from '../../lib/imageUpload'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

interface MediaItem {
  id: number
  user_id: number
  username: string
  avatar_url?: string
  title: string
  description?: string
  media_type: string
  file_url: string
  created_at: string
}

function getVideoEmbed(url: string): { type: string; embed: string; thumb: string } | null {
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (ytMatch) {
    const id = ytMatch[1]
    return {
      type: 'youtube',
      embed: `https://www.youtube.com/embed/${id}`,
      thumb: `https://img.youtube.com/vi/${id}/hqdefault.jpg`,
    }
  }
  // Twitch clip
  const twClip = url.match(/clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/)
  if (twClip) {
    return {
      type: 'twitch',
      embed: `https://clips.twitch.tv/embed?clip=${twClip[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`,
      thumb: '',
    }
  }
  // Twitch VOD
  const twVod = url.match(/twitch\.tv\/videos\/(\d+)/)
  if (twVod) {
    return {
      type: 'twitch',
      embed: `https://player.twitch.tv/?video=${twVod[1]}&parent=${typeof window !== 'undefined' ? window.location.hostname : 'localhost'}`,
      thumb: '',
    }
  }
  // TikTok
  const ttMatch = url.match(/tiktok\.com\/@[^/]+\/video\/(\d+)/)
  if (ttMatch) {
    return {
      type: 'tiktok',
      embed: `https://www.tiktok.com/embed/v2/${ttMatch[1]}`,
      thumb: '',
    }
  }
  return null
}

function detectMediaType(url: string): string {
  if (/youtube|youtu\.be/.test(url)) return 'youtube'
  if (/twitch\.tv/.test(url)) return 'twitch'
  if (/tiktok\.com/.test(url)) return 'tiktok'
  return 'youtube'
}

function MediaThumb({ item }: { item: MediaItem }) {
  if (item.media_type === 'image') {
    return <img src={item.file_url} alt={item.title} />
  }
  const info = getVideoEmbed(item.file_url)
  if (info?.thumb) {
    return <img src={info.thumb} alt={item.title} />
  }
  const icons: Record<string, string> = { youtube: '▶', twitch: '🎮', tiktok: '♪' }
  const labels: Record<string, string> = { youtube: 'YouTube', twitch: 'Twitch', tiktok: 'TikTok' }
  return (
    <div className={styles.videoPlaceholder}>
      <span className={styles.videoIcon}>{icons[item.media_type] ?? '▶'}</span>
      <span className={styles.videoLabel}>{labels[item.media_type] ?? 'Видео'}</span>
    </div>
  )
}

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [showUpload, setShowUpload] = useState(false)
  const [tab, setTab] = useState<'image' | 'video'>('image')

  // image upload
  const [imgFile, setImgFile] = useState<File | null>(null)
  const [imgPreview, setImgPreview] = useState<string | null>(null)
  const [imgUploading, setImgUploading] = useState(false)

  // video by url
  const [videoUrl, setVideoUrl] = useState('')
  const [videoPreview, setVideoPreview] = useState<ReturnType<typeof getVideoEmbed>>(null)

  const [formTitle, setFormTitle] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const myUserId = token ? (() => {
    try { return JSON.parse(atob(token.split('.')[1])).user_id } catch { return null }
  })() : null

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY))
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const res = await axios.get<MediaItem[]>(`${API_URL}/api/media`)
      setItems(res.data)
    } catch { } finally { setLoading(false) }
  }

  const handleFile = (f: File) => {
    setImgFile(f)
    const reader = new FileReader()
    reader.onload = e => setImgPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleVideoUrlChange = (url: string) => {
    setVideoUrl(url)
    setVideoPreview(getVideoEmbed(url))
  }

  const handleSave = async () => {
    if (!token || !formTitle.trim()) return
    setSaving(true)
    try {
      if (tab === 'image') {
        if (!imgFile) return
        const result = await uploadImage(imgFile)
        if (!result.success || !result.url) { alert(result.error || 'Ошибка загрузки'); return }
        await axios.post(`${API_URL}/api/media/add-url`, {
          title: formTitle.trim(),
          description: formDesc || null,
          media_type: 'image',
          file_url: result.url,
        }, { headers: { Authorization: `Bearer ${token}` } })
      } else {
        if (!videoUrl.trim() || !videoPreview) return
        await axios.post(`${API_URL}/api/media/add-url`, {
          title: formTitle.trim(),
          description: formDesc || null,
          media_type: detectMediaType(videoUrl),
          file_url: videoUrl.trim(),
        }, { headers: { Authorization: `Bearer ${token}` } })
      }
      closeUpload()
      fetchMedia()
    } catch { alert('Ошибка сохранения') }
    finally { setSaving(false) }
  }

  const closeUpload = () => {
    setShowUpload(false)
    setImgFile(null); setImgPreview(null)
    setVideoUrl(''); setVideoPreview(null)
    setFormTitle(''); setFormDesc('')
  }

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Удалить?') || !token) return
    await axios.delete(`${API_URL}/api/media/${item.id}`, { headers: { Authorization: `Bearer ${token}` } })
    setSelected(null)
    fetchMedia()
  }

  const canSave = tab === 'image'
    ? !!imgFile && !!formTitle.trim()
    : !!videoPreview && !!formTitle.trim()

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Медиа</h1>
          <p className={styles.subtitle}>Эпичные моменты, мемасы и нарезки Лесной Команды</p>
        </div>

        {token && (
          <button className={styles.uploadBtn} onClick={() => setShowUpload(true)}>
            <Upload size={16} /> Загрузить
          </button>
        )}

        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : items.length === 0 ? (
          <div className={styles.empty}><ImageIcon size={48} /><p>Пока ничего нет. Будь первым!</p></div>
        ) : (
          <div className={styles.grid}>
            {items.map(item => (
              <div key={item.id} className={styles.card} onClick={() => setSelected(item)}>
                <div className={styles.cardImg}>
                  <MediaThumb item={item} />
                  {item.media_type !== 'image' && (
                    <div className={styles.playOverlay}><span>▶</span></div>
                  )}
                  <div className={styles.typeBadge}>
                    {item.media_type === 'image' ? <ImageIcon size={12} /> : <Film size={12} />}
                    {item.media_type}
                  </div>
                </div>
                <div className={styles.cardInfo}>
                  <span className={styles.cardTitle}>{item.title}</span>
                  <span className={styles.cardUser}>@{item.username}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      {selected && (
        <div className={styles.overlay} onClick={() => setSelected(null)}>
          <div className={styles.lightbox} onClick={e => e.stopPropagation()}>
            <button className={styles.closeBtn} onClick={() => setSelected(null)}><X size={20} /></button>
            {selected.media_type === 'image' ? (
              <img src={selected.file_url} alt={selected.title} className={styles.lightboxImg} />
            ) : (() => {
              const info = getVideoEmbed(selected.file_url)
              return info ? (
                <div className={styles.lightboxEmbed}>
                  <iframe
                    src={info.embed}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    frameBorder="0"
                  />
                </div>
              ) : (
                <div className={styles.lightboxLink}>
                  <a href={selected.file_url} target="_blank" rel="noopener noreferrer">Открыть видео →</a>
                </div>
              )
            })()}
            <div className={styles.lightboxMeta}>
              <h3>{selected.title}</h3>
              {selected.description && <p>{selected.description}</p>}
              <span className={styles.lightboxUser}>@{selected.username}</span>
              {myUserId === selected.user_id && (
                <button className={styles.deleteBtn} onClick={() => handleDelete(selected)}>Удалить</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className={styles.overlay} onClick={closeUpload}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Загрузить медиа</h3>
              <button onClick={closeUpload}><X size={18} /></button>
            </div>

            <div className={styles.tabs}>
              <button className={tab === 'image' ? styles.tabActive : styles.tabBtn} onClick={() => setTab('image')}>
                <ImageIcon size={14} /> Фото
              </button>
              <button className={tab === 'video' ? styles.tabActive : styles.tabBtn} onClick={() => setTab('video')}>
                <Film size={14} /> Видео по ссылке
              </button>
            </div>

            {tab === 'image' ? (
              <div
                className={styles.dropzone}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => e.preventDefault()}
                onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
              >
                {imgPreview ? (
                  <img src={imgPreview} alt="preview" className={styles.previewImg} />
                ) : (
                  <><Upload size={28} /><p>Нажми или перетащи файл</p><small>JPEG, PNG, GIF, WEBP — до 10 МБ</small></>
                )}
                <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
              </div>
            ) : (
              <div className={styles.urlSection}>
                <div className={styles.urlInputWrap}>
                  <Link size={16} className={styles.urlIcon} />
                  <input
                    className={styles.urlInput}
                    placeholder="YouTube, Twitch клип или TikTok ссылка"
                    value={videoUrl}
                    onChange={e => handleVideoUrlChange(e.target.value)}
                  />
                </div>
                {videoPreview && (
                  <div className={styles.videoEmbedPreview}>
                    <iframe
                      src={videoPreview.embed}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      frameBorder="0"
                    />
                  </div>
                )}
                {videoUrl && !videoPreview && (
                  <p className={styles.urlError}>Ссылка не распознана. Поддерживается YouTube, Twitch, TikTok.</p>
                )}
              </div>
            )}

            <input
              className={styles.input}
              placeholder="Название *"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
            />
            <textarea
              className={styles.input}
              placeholder="Описание (опционально)"
              rows={2}
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
            />

            <button className={styles.submitBtn} onClick={handleSave} disabled={saving || !canSave}>
              {saving ? 'Сохранение...' : 'Опубликовать'}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
