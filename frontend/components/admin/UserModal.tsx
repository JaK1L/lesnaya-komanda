'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import styles from './NewsModal.module.css'

interface User {
  id: number
  discord_id: number
  discord_username: string
  forest_rank: string
  rating: number
  avatar_url: string | null
}

interface UserModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingUser: User | null
}

const RANKS = [
  '🌱 Росток',
  '🌿 Трава',
  '🪵 Бревно',
  '🌲 Дерево',
  '🐺 Старый Волк',
  '🔥 Лесной Дух',
]

export function UserModal({ isOpen, onClose, onSave, editingUser }: UserModalProps) {
  const [newRank, setNewRank] = useState('')
  const [newRating, setNewRating] = useState(0)

  useEffect(() => {
    if (editingUser) {
      setNewRank(editingUser.forest_rank)
      setNewRating(editingUser.rating)
    }
  }, [editingUser, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!editingUser) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/${editingUser.id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            forest_rank: newRank,
            rating: newRating,
          }),
        }
      )

      if (!response.ok) throw new Error('Failed to update')
      
      onSave()
      onClose()
    } catch (error) {
      console.error('Error updating user:', error)
      alert('Ошибка при обновлении пользователя')
    }
  }

  if (!isOpen || !editingUser) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Редактировать пользователя</h2>
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
            {editingUser.avatar_url && (
              <img 
                src={editingUser.avatar_url} 
                alt={editingUser.discord_username}
                style={{ 
                  width: '64px', 
                  height: '64px', 
                  borderRadius: '50%',
                  objectFit: 'cover'
                }}
              />
            )}
            <div>
              <h3 style={{ margin: 0 }}>{editingUser.discord_username}</h3>
              <small style={{ color: '#888' }}>ID: {editingUser.discord_id}</small>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rank">Ранг</label>
            <select
              id="rank"
              value={newRank}
              onChange={(e) => setNewRank(e.target.value)}
            >
              {RANKS.map((rank) => (
                <option key={rank} value={rank}>
                  {rank}
                </option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="rating">Рейтинг</label>
            <input
              id="rating"
              type="number"
              value={newRating}
              onChange={(e) => setNewRating(parseFloat(e.target.value))}
              min={0}
              max={100}
            />
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
