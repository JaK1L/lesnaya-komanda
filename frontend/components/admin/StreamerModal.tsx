'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { FormValidator, rules, useFormValidation } from '../../lib/validation'
import { FormField } from '../ui/FormError'
import styles from './NewsModal.module.css'

interface StreamerFormData {
  twitch_url: string
  is_active: boolean
  display_order: number
}

interface Streamer {
  id: number
  twitch_username: string
  display_name: string
  is_active: boolean
  display_order: number
}

interface StreamerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingStreamer: Streamer | null
}

export function StreamerModal({ isOpen, onClose, onSave, editingStreamer }: StreamerModalProps) {
  const [formData, setFormData] = useState<StreamerFormData>({
    twitch_url: '',
    is_active: true,
    display_order: 0,
  })

  const { errors, validateForm, clearErrors } = useFormValidation()

  const streamerValidator = new FormValidator()
    .field('twitch_url', rules.required('Ссылка на Twitch обязательна'), rules.url('Неверный формат URL'))

  useEffect(() => {
    if (editingStreamer) {
      setFormData({
        twitch_url: `https://twitch.tv/${editingStreamer.twitch_username}`,
        is_active: editingStreamer.is_active,
        display_order: editingStreamer.display_order,
      })
    } else {
      setFormData({
        twitch_url: '',
        is_active: true,
        display_order: 0,
      })
    }
    clearErrors()
  }, [editingStreamer, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
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
      
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error saving streamer:', error)
      alert(error.message || 'Ошибка при сохранении стримера')
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editingStreamer ? 'Обновить данные стримера' : 'Добавить стримера'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
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
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
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
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>Показывать на сайте</span>
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              {editingStreamer ? 'Обновить данные' : 'Добавить стримера'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
