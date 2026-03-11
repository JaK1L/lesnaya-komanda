'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { FormValidator, rules, useFormValidation } from '../../lib/validation'
import { FormField } from '../ui/FormError'
import styles from './NewsModal.module.css'

interface FeedFormData {
  kind: 'post' | 'achievement'
  title: string
  content: string
}

interface FeedItem {
  id: number
  kind: 'post' | 'achievement'
  title: string
  content: string | null
  created_at: string
}

interface FeedModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingFeed: FeedItem | null
}

export function FeedModal({ isOpen, onClose, onSave, editingFeed }: FeedModalProps) {
  const [formData, setFormData] = useState<FeedFormData>({
    kind: 'post',
    title: '',
    content: '',
  })

  const { errors, validateForm, clearErrors } = useFormValidation()

  const feedValidator = new FormValidator()
    .field('title', rules.required('Заголовок обязателен'), rules.maxLength(200, 'Максимум 200 символов'))

  useEffect(() => {
    if (editingFeed) {
      setFormData({
        kind: editingFeed.kind,
        title: editingFeed.title,
        content: editingFeed.content || '',
      })
    } else {
      setFormData({
        kind: 'post',
        title: '',
        content: '',
      })
    }
    clearErrors()
  }, [editingFeed, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm(feedValidator, formData)) {
      return
    }
    
    try {
      const token = localStorage.getItem('admin_token')
      const url = editingFeed
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/feed/${editingFeed.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/feed`
      
      const method = editingFeed ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          content: formData.content || null,
        }),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving feed item:', error)
      alert('Ошибка при сохранении записи')
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editingFeed ? 'Редактировать запись' : 'Создать запись'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="kind">Тип записи</label>
            <select
              id="kind"
              value={formData.kind}
              onChange={(e) => setFormData({ ...formData, kind: e.target.value as 'post' | 'achievement' })}
            >
              <option value="post">📝 Пост</option>
              <option value="achievement">🏆 Достижение</option>
            </select>
          </div>

          <FormField label="Заголовок" error={errors.title} required htmlFor="title">
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder={
                formData.kind === 'post'
                  ? 'Новый рекорд сервера!'
                  : 'JaK1L получил достижение "Мастер CS2"'
              }
              maxLength={200}
            />
          </FormField>

          <div className={styles.formGroup}>
            <label htmlFor="content">Описание (необязательно)</label>
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Дополнительная информация..."
              rows={4}
              maxLength={2000}
            />
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              {editingFeed ? 'Сохранить изменения' : 'Создать запись'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
