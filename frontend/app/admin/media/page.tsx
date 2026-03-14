'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Trash2, Image as ImageIcon, Film } from 'lucide-react'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface MediaItem {
  id: number
  user_id: number
  username: string
  title: string
  media_type: string
  file_url: string
  created_at: string
}

export default function AdminMediaPage() {
  const router = useRouter()
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { router.push('/admin'); return }
    fetchMedia()
  }, [router])

  const fetchMedia = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const res = await axios.get<MediaItem[]>(`${API_URL}/api/media`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { limit: 100 },
      })
      setItems(res.data)
    } catch { } finally { setLoading(false) }
  }

  const handleDelete = async (item: MediaItem) => {
    if (!confirm(`Удалить "${item.title}"?`)) return
    setDeleting(item.id)
    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/api/media/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setItems(prev => prev.filter(i => i.id !== item.id))
    } catch { alert('Ошибка удаления') }
    finally { setDeleting(null) }
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>← Назад</button>
        <h1>Медиа ({items.length})</h1>
        <div style={{ width: 80 }} />
      </header>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : items.length === 0 ? (
        <div className={styles.empty}>Медиафайлов нет</div>
      ) : (
        <div className={styles.grid}>
          {items.map(item => (
            <div key={item.id} className={styles.card}>
              <div className={styles.thumb}>
                {item.media_type === 'image'
                  ? <img src={item.file_url.startsWith('http') ? item.file_url : `${API_URL}${item.file_url}`} alt={item.title} />
                  : <div className={styles.videoThumb}><Film size={28} /></div>
                }
                <span className={styles.badge}>
                  {item.media_type === 'image' ? <ImageIcon size={11} /> : <Film size={11} />}
                  {item.media_type}
                </span>
              </div>
              <div className={styles.info}>
                <span className={styles.title}>{item.title}</span>
                <span className={styles.user}>@{item.username}</span>
              </div>
              <button
                className={styles.deleteBtn}
                onClick={() => handleDelete(item)}
                disabled={deleting === item.id}
                title="Удалить"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
