'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadImage } from '../../../lib/imageUpload'
import styles from '../news/page.module.css'

interface Streamer {
  id: number
  name: string
  game: string | null
  avatar_url: string | null
  platform: string
  stream_url: string
  schedule: string | null
  is_active: boolean
  display_order: number
}

export default function AdminStreamersPage() {
  const router = useRouter()
  const [streamers, setStreamers] = useState<Streamer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    game: '',
    avatar_url: '',
    platform: 'twitch',
    stream_url: '',
    schedule: '',
    is_active: true,
    display_order: 0,
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchStreamers()
  }, [router])

  const fetchStreamers = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/streamers`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setStreamers(data)
    } catch (error) {
      console.error('Error fetching streamers:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData({ ...formData, avatar_url: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let avatarUrl = formData.avatar_url

      // Загружаем изображение если выбрано
      if (imageFile) {
        setIsUploading(true)
        const result = await uploadImage(imageFile)
        if (result.success && result.url) {
          avatarUrl = result.url
        } else {
          alert(result.error || 'Ошибка загрузки изображения')
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      const token = localStorage.getItem('admin_token')
      const url = editingStreamer
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/streamers/${editingStreamer.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/streamers`
      
      const method = editingStreamer ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        avatar_url: avatarUrl || null,
        game: formData.game || null,
        schedule: formData.schedule || null,
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      await fetchStreamers()
      handleCancelEdit()
    } catch (error) {
      console.error('Error saving streamer:', error)
      alert('Ошибка при сохранении стримера')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этого стримера?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/streamers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete')
      
      await fetchStreamers()
    } catch (error) {
      console.error('Error deleting streamer:', error)
      alert('Ошибка при удалении')
    }
  }

  const handleEdit = (item: Streamer) => {
    setEditingStreamer(item)
    setFormData({
      name: item.name,
      game: item.game || '',
      avatar_url: item.avatar_url || '',
      platform: item.platform,
      stream_url: item.stream_url,
      schedule: item.schedule || '',
      is_active: item.is_active,
      display_order: item.display_order,
    })
    setImagePreview(item.avatar_url || '')
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingStreamer(null)
    setFormData({
      name: '',
      game: '',
      avatar_url: '',
      platform: 'twitch',
      stream_url: '',
      schedule: '',
      is_active: true,
      display_order: 0,
    })
    setImageFile(null)
    setImagePreview('')
    setShowForm(false)
  }

  if (isLoading) {
    return <div className={styles.loading}>Загрузка...</div>
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          ← Назад
        </button>
        <h1>🎮 Управление стримерами</h1>
        <button onClick={() => {
          if (showForm && editingStreamer) {
            handleCancelEdit()
          } else {
            setShowForm(!showForm)
          }
        }} className={styles.addButton}>
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </header>

      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              {editingStreamer ? 'Редактировать стримера' : 'Добавить стримера'}
            </h2>

            <div className={styles.formGroup}>
              <label htmlFor="name">Имя стримера</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="JaK1L"
                required
                maxLength={100}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="game">Игры</label>
              <input
                id="game"
                type="text"
                value={formData.game}
                onChange={(e) => setFormData({ ...formData, game: e.target.value })}
                placeholder="CS2, Dota 2, Valorant"
                maxLength={200}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Аватар</label>
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  id="avatar-upload"
                />
                <label htmlFor="avatar-upload" style={{ 
                  padding: '0.75rem 1rem',
                  background: '#7cb342',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'inline-block',
                  width: 'fit-content'
                }}>
                  📁 Выбрать файл
                </label>
                
                <input
                  type="url"
                  value={formData.avatar_url}
                  onChange={(e) => {
                    setFormData({ ...formData, avatar_url: e.target.value })
                    setImagePreview(e.target.value)
                  }}
                  placeholder="Или вставьте ссылку на изображение"
                  maxLength={500}
                />

                {imagePreview && (
                  <div style={{ position: 'relative', width: 'fit-content' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '200px', 
                        maxHeight: '200px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        fontSize: '18px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="platform">Платформа</label>
              <select
                id="platform"
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
              >
                <option value="twitch">Twitch</option>
                <option value="youtube">YouTube</option>
                <option value="other">Другая</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="stream_url">Ссылка на канал</label>
              <input
                id="stream_url"
                type="url"
                value={formData.stream_url}
                onChange={(e) => setFormData({ ...formData, stream_url: e.target.value })}
                placeholder="https://twitch.tv/username"
                required
                maxLength={500}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="schedule">Расписание (необязательно)</label>
              <input
                id="schedule"
                type="text"
                value={formData.schedule}
                onChange={(e) => setFormData({ ...formData, schedule: e.target.value })}
                placeholder="Пн, Ср, Пт в 19:00"
                maxLength={200}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="display_order">Порядок отображения</label>
              <input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                min={0}
              />
              <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                Меньше число = выше в списке
              </small>
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                Показывать на сайте
              </label>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isUploading}>
              {isUploading ? 'Загрузка изображения...' : editingStreamer ? 'Сохранить изменения' : 'Добавить стримера'}
            </button>
          </form>
        </div>
      )}

      <div className={styles.list}>
        {streamers.length === 0 ? (
          <div className={styles.empty}>
            <p>Стримеров пока нет</p>
            <button onClick={() => setShowForm(true)} className={styles.emptyButton}>
              Добавить первого стримера
            </button>
          </div>
        ) : (
          streamers.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {item.avatar_url && (
                    <img 
                      src={item.avatar_url} 
                      alt={item.name}
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div>
                    <h3>{item.name}</h3>
                    <small style={{ color: '#888' }}>{item.platform}</small>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <span className={item.is_active ? styles.published : styles.draft}>
                    {item.is_active ? 'Активен' : 'Скрыт'}
                  </span>
                  <button
                    onClick={() => handleEdit(item)}
                    className={styles.editButton}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={styles.deleteButton}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>
              <p className={styles.cardContent}>{item.game || 'Игры не указаны'}</p>
              <div className={styles.cardFooter}>
                <span className={styles.date}>
                  🔗 {item.stream_url}
                </span>
                {item.schedule && (
                  <span className={styles.draft}>
                    📅 {item.schedule}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
