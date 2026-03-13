'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { FormValidator, rules, useFormValidation } from '../../lib/validation'
import { FormField } from '../ui/FormError'
import { getImageUrl } from '../../lib/imageUtils'
import styles from './NewsModal.module.css'

interface TeamMember {
  id: number
  discord_id: number
  discord_username: string
  real_name?: string
  avatar_url?: string
  bio?: string
  forest_rank: string
  team_role?: string
  twitch_username?: string
  telegram_url?: string
  tiktok_url?: string
  youtube_url?: string
  is_team_member: boolean
  team_order: number
}

interface TeamModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingMember: TeamMember | null
}

export function TeamModal({ isOpen, onClose, onSave, editingMember }: TeamModalProps) {
  const [formData, setFormData] = useState<Partial<TeamMember>>({
    real_name: '',
    bio: '',
    team_role: '',
    telegram_url: '',
    tiktok_url: '',
    youtube_url: '',
    team_order: 0,
  })

  const { errors, validateForm, clearErrors } = useFormValidation()

  const teamValidator = new FormValidator()
    .field('team_role', rules.maxLength(100, 'Максимум 100 символов'))
    .field('bio', rules.maxLength(500, 'Максимум 500 символов'))

  useEffect(() => {
    if (editingMember) {
      setFormData({
        real_name: editingMember.real_name || '',
        bio: editingMember.bio || '',
        team_role: editingMember.team_role || '',
        telegram_url: editingMember.telegram_url || '',
        tiktok_url: editingMember.tiktok_url || '',
        youtube_url: editingMember.youtube_url || '',
        team_order: editingMember.team_order,
      })
    }
    clearErrors()
  }, [editingMember, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm(teamValidator, formData)) {
      return
    }

    if (!editingMember) return
    
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/team/${editingMember.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            real_name: formData.real_name || null,
            bio: formData.bio || null,
            team_role: formData.team_role || null,
            telegram_url: formData.telegram_url || null,
            tiktok_url: formData.tiktok_url || null,
            youtube_url: formData.youtube_url || null,
            is_team_member: true,
            team_order: formData.team_order
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to save')
      
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving team member:', error)
      alert('Ошибка при сохранении')
    }
  }

  if (!isOpen || !editingMember) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Редактировать участника команды</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1rem', 
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#1a1a1a',
            borderRadius: '8px'
          }}>
            {editingMember.avatar_url && (
              <img 
                src={getImageUrl(editingMember.avatar_url) || ''} 
                alt={editingMember.discord_username}
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}
            <div>
              <h3 style={{ margin: 0 }}>{editingMember.discord_username}</h3>
              <small style={{ color: '#888' }}>{editingMember.forest_rank}</small>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="real_name">Настоящее имя (необязательно)</label>
            <input
              id="real_name"
              type="text"
              value={formData.real_name}
              onChange={(e) => setFormData({ ...formData, real_name: e.target.value })}
              placeholder="Иван Иванов"
              maxLength={100}
            />
          </div>

          <FormField label="Роль в команде" error={errors.team_role} htmlFor="team_role">
            <input
              id="team_role"
              type="text"
              value={formData.team_role}
              onChange={(e) => setFormData({ ...formData, team_role: e.target.value })}
              placeholder="Основатель, Модератор, Стример..."
              maxLength={100}
            />
          </FormField>

          <FormField label="Биография" error={errors.bio} htmlFor="bio">
            <textarea
              id="bio"
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="Расскажите о себе..."
              rows={4}
              maxLength={500}
            />
          </FormField>

          <div className={styles.formGroup}>
            <label htmlFor="telegram_url">Telegram (необязательно)</label>
            <input
              id="telegram_url"
              type="url"
              value={formData.telegram_url}
              onChange={(e) => setFormData({ ...formData, telegram_url: e.target.value })}
              placeholder="https://t.me/username"
              maxLength={200}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tiktok_url">TikTok (необязательно)</label>
            <input
              id="tiktok_url"
              type="url"
              value={formData.tiktok_url}
              onChange={(e) => setFormData({ ...formData, tiktok_url: e.target.value })}
              placeholder="https://tiktok.com/@username"
              maxLength={200}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="youtube_url">YouTube (необязательно)</label>
            <input
              id="youtube_url"
              type="url"
              value={formData.youtube_url}
              onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
              placeholder="https://youtube.com/@username"
              maxLength={200}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="team_order">Порядок отображения</label>
            <input
              id="team_order"
              type="number"
              value={formData.team_order}
              onChange={(e) => setFormData({ ...formData, team_order: parseInt(e.target.value) || 0 })}
              min={0}
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Меньше число = выше в списке
            </small>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              Сохранить изменения
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
