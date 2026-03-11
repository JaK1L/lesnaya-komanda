'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FormValidator, rules, useFormValidation } from '../../../lib/validation'
import { FormField } from '../../../components/ui/FormError'
import { AdminTableSkeleton } from '../../../components/skeletons'
import styles from '../news/page.module.css'

interface Streamer {
  id: number
  twitch_username: string
  display_name: string
  avatar_url: string | null
  description: string | null
  is_active: boolean
  display_order: number
  // Live данные
  is_live?: boolean
  game_name?: string | null
  stream_title?: string | null
  viewer_count?: number
}

export default function AdminStreamersPage() {
  const router = useRouter()
  const [streamers, setStreamers] = useState<Streamer[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingStreamer, setEditingStreamer] = useState<Streamer | null>(null)
  
  const [formData, setFormData] = useState({
    twitch_url: '',
    is_active: true,
    display_order: 0,
  })

  // Валидация
  const { errors, validateForm, clearErrors } = useFormValidation()

  // Валидатор для формы стримеров
  const streamerValidator = new FormValidator()
    .field('twitch_url', rules.required('Ссылка на Twitch обязательна'), rules.url('Неверный формат URL'))

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Валидация формы
    if (!validateForm(streamerValidator, formData)) {
      return
    }
    
    try {
      const token = localStorage.getItem('admin_token')
      const url = editingStreamer
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/streamers/${editingStreamer.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/streamers`
      
      const method = editingStreamer ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.detail || 'Failed to save')
      }
      
      await fetchStreamers()
      handleCancelEdit()
    } catch (error: any) {
      console.error('Error saving streamer:', error)
      alert(error.message || 'Ошибка при сохранении стримера')
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
      twitch_url: `https://twitch.tv/${item.twitch_username}`,
      is_active: item.is_active,
      display_order: item.display_order,
    })
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingStreamer(null)
    setFormData({
      twitch_url: '',
      is_active: true,
      display_order: 0,
    })
    setShowForm(false)
    clearErrors()
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>🎮 Управление стримерами</h1>
          <div style={{ width: '120px' }} /> {/* Spacer */}
        </header>
        <AdminTableSkeleton rows={5} />
      </div>
    )
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
              {editingStreamer ? 'Обновить данные стримера' : 'Добавить стримера'}
            </h2>

            <div style={{ 
              background: '#e3f2fd', 
              padding: '1rem', 
              borderRadius: '8px', 
              marginBottom: '1.5rem',
              border: '1px solid #90caf9'
            }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#1976d2' }}>
                💡 Просто вставьте ссылку на Twitch канал, и система автоматически получит всю информацию: 
                имя, аватар, описание и статус стрима!
              </p>
            </div>

            <FormField label="Ссылка на Twitch канал" error={errors.twitch_url} required htmlFor="twitch_url">
              <input
                id="twitch_url"
                type="url"
                value={formData.twitch_url}
                onChange={(e) => setFormData({ ...formData, twitch_url: e.target.value })}
                placeholder="https://twitch.tv/username или просто username"
                maxLength={500}
                className={styles.input}
              />
              <small style={{ color: '#666', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                Примеры: https://twitch.tv/jak1lqa или просто jak1lqa
              </small>
            </FormField>

            <div className={styles.formGroup}>
              <label htmlFor="display_order">Порядок отображения</label>
              <input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
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

            <button type="submit" className={styles.submitButton}>
              {editingStreamer ? 'Обновить данные' : 'Добавить стримера'}
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
                      alt={item.display_name}
                      style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: item.is_live ? '3px solid #9146ff' : '3px solid transparent'
                      }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>{item.display_name}</h3>
                      {item.is_live && (
                        <span style={{ 
                          background: '#eb0400', 
                          color: 'white', 
                          padding: '2px 8px', 
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 'bold'
                        }}>
                          🔴 LIVE
                        </span>
                      )}
                    </div>
                    <small style={{ color: '#888' }}>@{item.twitch_username}</small>
                    {item.is_live && item.viewer_count > 0 && (
                      <div style={{ marginTop: '0.25rem', fontSize: '0.85rem', color: '#666' }}>
                        👁️ {item.viewer_count.toLocaleString()} зрителей
                      </div>
                    )}
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
              
              {item.description && (
                <p className={styles.cardContent} style={{ 
                  marginTop: '0.75rem',
                  color: '#666',
                  fontSize: '0.9rem'
                }}>
                  {item.description}
                </p>
              )}
              
              {item.is_live && item.game_name && (
                <div style={{ 
                  marginTop: '0.75rem',
                  padding: '0.5rem',
                  background: '#f5f5f5',
                  borderRadius: '4px',
                  fontSize: '0.9rem'
                }}>
                  <strong>🎮 {item.game_name}</strong>
                  {item.stream_title && (
                    <div style={{ marginTop: '0.25rem', color: '#666' }}>
                      {item.stream_title}
                    </div>
                  )}
                </div>
              )}
              
              <div className={styles.cardFooter} style={{ marginTop: '0.75rem' }}>
                <span className={styles.date}>
                  🔗 twitch.tv/{item.twitch_username}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
