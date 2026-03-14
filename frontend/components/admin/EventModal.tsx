'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { FormValidator, rules, useFormValidation } from '../../lib/validation'
import { FormField } from '../ui/FormError'
import styles from './NewsModal.module.css'

interface EventFormData {
  title: string
  description: string
  game: string
  event_date: string
  telegram_url: string
  status: string
  expires_at: string
  button_url: string
  button_label: string
}

interface Event {
  id: number
  title: string
  description: string
  game: string
  event_date: string
  telegram_url: string | null
  status: string
  expires_at: string | null
  button_url: string | null
  button_label: string | null
}

interface EventModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingEvent: Event | null
}

export function EventModal({ isOpen, onClose, onSave, editingEvent }: EventModalProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: '',
    description: '',
    game: 'Общее',
    event_date: '',
    telegram_url: '',
    status: 'Планируется',
    expires_at: '',
    button_url: '',
    button_label: '',
  })

  const { errors, validateForm, clearErrors } = useFormValidation()

  const eventValidator = new FormValidator()
    .field('title', rules.required('Название обязательно'), rules.maxLength(200, 'Максимум 200 символов'))
    .field('description', rules.required('Описание обязательно'), rules.maxLength(2000, 'Максимум 2000 символов'))
    .field('event_date', rules.required('Дата события обязательна'))

  useEffect(() => {
    if (editingEvent) {
      const eventDate = new Date(editingEvent.event_date)
      const localDate = new Date(eventDate.getTime() - eventDate.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16)
      
      let expiresDate = ''
      if (editingEvent.expires_at) {
        const expires = new Date(editingEvent.expires_at)
        expiresDate = new Date(expires.getTime() - expires.getTimezoneOffset() * 60000)
          .toISOString()
          .slice(0, 16)
      }
      
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description,
        game: editingEvent.game,
        event_date: localDate,
        telegram_url: editingEvent.telegram_url || '',
        status: editingEvent.status,
        expires_at: expiresDate,
        button_url: editingEvent.button_url || '',
        button_label: editingEvent.button_label || '',
      })
    } else {
      setFormData({
        title: '',
        description: '',
        game: 'Общее',
        event_date: '',
        telegram_url: '',
        status: 'Планируется',
        expires_at: '',
        button_url: '',
        button_label: '',
      })
    }
    clearErrors()
  }, [editingEvent, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm(eventValidator, formData)) {
      return
    }
    
    try {
      const token = localStorage.getItem('admin_token')
      const url = editingEvent
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/events/${editingEvent.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/events`
      
      const method = editingEvent ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        expires_at: formData.expires_at || null
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
      
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving event:', error)
      alert('Ошибка при сохранении события')
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editingEvent ? 'Редактировать событие' : 'Создать событие'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <FormField label="Название события" error={errors.title} required htmlFor="title">
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="CS2 Турнир 5v5"
              maxLength={200}
            />
          </FormField>

          <FormField label="Описание" error={errors.description} required htmlFor="description">
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание события..."
              rows={6}
              maxLength={2000}
            />
          </FormField>

          <div className={styles.formGroup}>
            <label htmlFor="game">Игра</label>
            <select
              id="game"
              value={formData.game}
              onChange={(e) => setFormData({ ...formData, game: e.target.value })}
            >
              <option value="Общее">Общее</option>
              <option value="CS2">CS2</option>
              <option value="Dota 2">Dota 2</option>
              <option value="Valorant">Valorant</option>
              <option value="PUBG">PUBG</option>
              <option value="Apex Legends">Apex Legends</option>
            </select>
          </div>

          <FormField label="Дата и время" error={errors.event_date} required htmlFor="event_date">
            <input
              id="event_date"
              type="datetime-local"
              value={formData.event_date}
              onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
            />
          </FormField>

          <div className={styles.formGroup}>
            <label htmlFor="expires_at">Скрыть событие после (необязательно)</label>
            <input
              id="expires_at"
              type="datetime-local"
              value={formData.expires_at}
              onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Событие автоматически исчезнет с сайта после указанной даты
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="telegram_url">Ссылка на Telegram пост (необязательно)</label>
            <input
              id="telegram_url"
              type="url"
              value={formData.telegram_url}
              onChange={(e) => setFormData({ ...formData, telegram_url: e.target.value })}
              placeholder="https://t.me/channel/123"
              maxLength={500}
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              При клике на событие пользователь перейдет по этой ссылке
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="button_label">Название кнопки (необязательно)</label>
            <input
              id="button_label"
              type="text"
              value={formData.button_label}
              onChange={(e) => setFormData({ ...formData, button_label: e.target.value })}
              placeholder="Зарегистрироваться, Подробнее..."
              maxLength={100}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="button_url">Ссылка для кнопки (необязательно)</label>
            <input
              id="button_url"
              type="url"
              value={formData.button_url}
              onChange={(e) => setFormData({ ...formData, button_url: e.target.value })}
              placeholder="https://..."
              maxLength={500}
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Кнопка отображается на карточке события на главной странице
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="status">Статус</label>
            <select
              id="status"
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
            >
              <option value="Планируется">Планируется</option>
              <option value="Регистрация открыта">Регистрация открыта</option>
              <option value="Идет сейчас">Идет сейчас</option>
              <option value="Завершено">Завершено</option>
              <option value="Отменено">Отменено</option>
            </select>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              {editingEvent ? 'Сохранить изменения' : 'Создать событие'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
