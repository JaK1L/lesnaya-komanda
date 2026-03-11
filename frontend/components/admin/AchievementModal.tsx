'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { FormValidator, rules, useFormValidation } from '../../lib/validation'
import { FormField } from '../ui/FormError'
import styles from './NewsModal.module.css'

interface AchievementFormData {
  name: string
  description: string
  icon: string
  category: string
  points: number
  is_active: boolean
}

interface AchievementType {
  id: number
  name: string
  description: string | null
  icon: string
  category: string
  points: number
  is_active: boolean
}

interface AchievementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingAchievement: AchievementType | null
}

export function AchievementModal({ isOpen, onClose, onSave, editingAchievement }: AchievementModalProps) {
  const [formData, setFormData] = useState<AchievementFormData>({
    name: '',
    description: '',
    icon: '🏆',
    category: 'general',
    points: 10,
    is_active: true,
  })

  const { errors, validateForm, clearErrors } = useFormValidation()

  const achievementValidator = new FormValidator()
    .field('name', rules.required('Название обязательно'), rules.maxLength(100, 'Максимум 100 символов'))
    .field('icon', rules.required('Иконка обязательна'))
    .field('points', rules.required('Очки обязательны'))

  useEffect(() => {
    if (editingAchievement) {
      setFormData({
        name: editingAchievement.name,
        description: editingAchievement.description || '',
        icon: editingAchievement.icon,
        category: editingAchievement.category,
        points: editingAchievement.points,
        is_active: editingAchievement.is_active,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '🏆',
        category: 'general',
        points: 10,
        is_active: true,
      })
    }
    clearErrors()
  }, [editingAchievement, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm(achievementValidator, formData)) {
      return
    }
    
    try {
      const token = localStorage.getItem('admin_token')
      const url = editingAchievement
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/achievements/types/${editingAchievement.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/achievements/types`
      
      const method = editingAchievement ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          requirement: {},
        }),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving achievement:', error)
      alert('Ошибка при сохранении достижения')
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editingAchievement ? 'Редактировать достижение' : 'Создать достижение'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <FormField label="Название" error={errors.name} required htmlFor="name">
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Первый шаг"
              maxLength={100}
            />
          </FormField>

          <div className={styles.formGroup}>
            <label htmlFor="description">Описание</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание достижения..."
              rows={3}
              maxLength={500}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Иконка" error={errors.icon} required htmlFor="icon">
              <input
                id="icon"
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="🏆"
                maxLength={10}
              />
            </FormField>

            <FormField label="Очки" error={errors.points} required htmlFor="points">
              <input
                id="points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </FormField>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Категория</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="general">Общие</option>
              <option value="activity">Активность</option>
              <option value="voice">Голосовые</option>
              <option value="events">События</option>
              <option value="games">Игры</option>
              <option value="special">Специальные</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              />
              <span>Активно</span>
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              {editingAchievement ? 'Сохранить изменения' : 'Создать достижение'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
