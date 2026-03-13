'use client'

import { useEffect, useState, useRef } from 'react'
import axios from 'axios'
import { Upload, X, Image as ImageIcon, Film } from 'lucide-react'
import { Navigation } from '../../components/layout/Navigation'
import { Footer } from '../../components/layout/Footer'
import { getImageUrl } from '../../lib/imageUtils'
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

export default function MediaPage() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [selected, setSelected] = useState<MediaItem | null>(null)
  const [uploading, setUploading] = useState(false)
  const [showUpload, setShowUpload] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', media_type: 'image' })
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY))
    fetchMedia()
  }, [])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const res = await axios.get<MediaItem[]>(`${API_URL}/api/media`)
      setItems(res.data)
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (f: File) => {
    setFile(f)
    const reader = new FileReader()
    reader.onload = (e) => setPreview(e.target?.result as string)
    reader.readAsDataURL(f)
  }

  const handleUpload = async () => {
    if (!file || !form.title.trim() || !token) return
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', form.title)
      fd.append('description', form.description)
      fd.append('media_type', form.media_type)
      await axios.post(`${API_URL}/api/media/upload`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      setShowUpload(false)
      setForm({ title: '', description: '', media_type: 'image' })
      setFile(null)
      setPreview(null)
      fetchMedia()
    } catch {
      alert('Ошибка загрузки')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (item: MediaItem) => {
    if (!confirm('Удалить?') || !token) return
    await axios.delete(`${API_URL}/api/media/${item.id}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    setSelected(null)
    fetchMedia()
  }

  const myUserId = token ? (() => {
    try { return JSON.parse(atob(token.split('.')[1])).user_id } catch { return null }
  })() : null

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
          <div className={styles.empty}>
            <ImageIcon size={48} />
            <p>Пока ничего нет. Будь первым!</p>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map(item => (
              <div key={item.id} className={styles.card} onClick={() => setSelected(item)}>
                <div className={styles.cardImg}>
                  <img src={getImageUrl(item.file_url) || ''} alt={item.title} />
                  {item.media_type === 'clip' && <div className={styles.clipBadge}><Film size={14} /> Клип</div>}
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
            <img src={getImageUrl(selected.file_url) || ''} alt={selected.title} className={styles.lightboxImg} />
            <div className={styles.lightboxMeta}>
              <h3>{selected.title}</h3>
              {selected.description && <p>{selected.description}</p>}
              <span className={styles.lightboxUser}>@{selected.username}</span>
              {(myUserId === selected.user_id) && (
                <button className={styles.deleteBtn} onClick={() => handleDelete(selected)}>Удалить</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upload modal */}
      {showUpload && (
        <div className={styles.overlay} onClick={() => setShowUpload(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Загрузить медиа</h3>
              <button onClick={() => setShowUpload(false)}><X size={18} /></button>
            </div>

            <div
              className={styles.dropzone}
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              {preview ? (
                <img src={preview} alt="preview" className={styles.previewImg} />
              ) : (
                <>
                  <Upload size={32} />
                  <p>Нажми или перетащи файл</p>
                  <small>JPEG, PNG, GIF, WEBP — до 10 МБ</small>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]) }} />
            </div>

            <input
              className={styles.input}
              placeholder="Название *"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
            />
            <textarea
              className={styles.input}
              placeholder="Описание (опционально)"
              rows={2}
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            />
            <select
              className={styles.input}
              value={form.media_type}
              onChange={e => setForm(f => ({ ...f, media_type: e.target.value }))}
            >
              <option value="image">Изображение</option>
              <option value="clip">Клип</option>
            </select>

            <button
              className={styles.submitBtn}
              onClick={handleUpload}
              disabled={uploading || !file || !form.title.trim()}
            >
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}
