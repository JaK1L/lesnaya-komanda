'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../news/page.module.css'

interface Settings {
  discord_join_url: string
  telegram_url: string | null
  maintenance_enabled: boolean
  maintenance_message: string | null
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [settings, setSettings] = useState<Settings>({
    discord_join_url: '',
    telegram_url: null,
    maintenance_enabled: false,
    maintenance_message: null,
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchSettings()
  }, [router])

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/common`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setSettings(data)
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/common`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      alert('Настройки сохранены!')
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Ошибка при сохранении настроек')
    } finally {
      setIsSaving(false)
    }
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
        <h1>⚙️ Настройки сайта</h1>
        <div style={{ width: '100px' }} />
      </header>

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>Общие настройки</h2>

          <div className={styles.formGroup}>
            <label htmlFor="discord_join_url">Ссылка на Discord сервер</label>
            <input
              id="discord_join_url"
              type="url"
              value={settings.discord_join_url}
              onChange={(e) => setSettings({ ...settings, discord_join_url: e.target.value })}
              placeholder="https://discord.gg/YgX4RQZ"
              required
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Используется на странице мерча и стримов
            </small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="telegram_url">Ссылка на Telegram</label>
            <input
              id="telegram_url"
              type="url"
              value={settings.telegram_url || ''}
              onChange={(e) => setSettings({ ...settings, telegram_url: e.target.value || null })}
              placeholder="https://t.me/lesnayakomanda"
            />
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Кнопка для заказов в мерче и связи на странице стримов
            </small>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={settings.maintenance_enabled}
                onChange={(e) => setSettings({ ...settings, maintenance_enabled: e.target.checked })}
              />
              <span>Режим технического обслуживания</span>
            </label>
            <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
              Когда включен, сайт будет показывать сообщение о техническом обслуживании
            </small>
          </div>

          {settings.maintenance_enabled && (
            <div className={styles.formGroup}>
              <label htmlFor="maintenance_message">Сообщение о техническом обслуживании</label>
              <textarea
                id="maintenance_message"
                value={settings.maintenance_message || ''}
                onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value })}
                placeholder="Сайт временно недоступен. Ведутся технические работы."
                rows={4}
              />
            </div>
          )}

          <button type="submit" className={styles.submitButton} disabled={isSaving}>
            {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
          </button>
        </form>

        <div className={styles.form} style={{ marginTop: '2rem' }}>
          <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Информация</h2>
          
          <div style={{ color: '#aaa', lineHeight: '1.8' }}>
            <p><strong>Версия:</strong> 1.0.0</p>
            <p><strong>API:</strong> {process.env.NEXT_PUBLIC_API_URL}</p>
            <p><strong>Окружение:</strong> {process.env.NODE_ENV}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
