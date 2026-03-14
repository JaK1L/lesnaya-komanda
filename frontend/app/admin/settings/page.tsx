'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Settings, ChevronLeft, Save, AlertTriangle, CheckCircle, XCircle, Link, Send, Wrench, Info } from 'lucide-react'
import styles from './page.module.css'

interface SiteSettings {
  discord_join_url: string
  telegram_url: string | null
  maintenance_enabled: boolean
  maintenance_message: string | null
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [settings, setSettings] = useState<SiteSettings>({
    discord_join_url: '',
    telegram_url: null,
    maintenance_enabled: false,
    maintenance_message: null,
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { router.push('/admin'); return }
    fetchSettings(token)
  }, [router])

  const fetchSettings = async (token?: string) => {
    const t = token || localStorage.getItem('admin_token')
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/common`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (!res.ok) throw new Error()
      setSettings(await res.json())
    } catch {
      showToast('error', 'Не удалось загрузить настройки')
    } finally {
      setIsLoading(false)
    }
  }

  const showToast = (type: 'success' | 'error', text: string) => {
    setToast({ type, text })
    setTimeout(() => setToast(null), 3500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const token = localStorage.getItem('admin_token')
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/settings/common`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (!res.ok) throw new Error()
      showToast('success', 'Настройки сохранены')
    } catch {
      showToast('error', 'Ошибка при сохранении')
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) return (
    <div className={styles.loading}>
      <div className={styles.spinner} />
      Загрузка...
    </div>
  )

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backBtn}>
          <ChevronLeft size={15} /> Назад
        </button>
        <h1 className={styles.title}>
          <Settings size={20} className={styles.titleIcon} />
          Настройки сайта
        </h1>
      </header>

      {toast && (
        <div className={`${styles.toast} ${toast.type === 'success' ? styles.toastSuccess : styles.toastError}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
          {toast.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className={styles.grid}>

          {/* Основные настройки */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Link size={13} /> Ссылки и интеграции
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ссылка на Discord сервер</label>
              <input
                className={styles.input}
                type="url"
                value={settings.discord_join_url}
                onChange={(e) => setSettings({ ...settings, discord_join_url: e.target.value })}
                placeholder="https://discord.gg/..."
                required
              />
              <span className={styles.hint}>Используется на странице мерча и стримов</span>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Ссылка на Telegram</label>
              <input
                className={styles.input}
                type="url"
                value={settings.telegram_url || ''}
                onChange={(e) => setSettings({ ...settings, telegram_url: e.target.value || null })}
                placeholder="https://t.me/..."
              />
              <span className={styles.hint}>Кнопка для заказов в мерче и связи на странице стримов</span>
            </div>

            <div className={styles.cardTitle} style={{ marginTop: '1.5rem' }}>
              <Wrench size={13} /> Техническое обслуживание
            </div>

            <label className={styles.toggle}>
              <span className={styles.toggleSwitch}>
                <input
                  type="checkbox"
                  checked={settings.maintenance_enabled}
                  onChange={(e) => setSettings({ ...settings, maintenance_enabled: e.target.checked })}
                />
                <span className={styles.toggleTrack} />
                <span className={styles.toggleThumb} />
              </span>
              <span className={styles.toggleLabel}>
                <span className={styles.toggleTitle}>Режим технического обслуживания</span>
                <span className={styles.toggleHint}>Сайт покажет заглушку для всех посетителей</span>
              </span>
            </label>

            {settings.maintenance_enabled && (
              <>
                <div className={styles.warningBanner}>
                  <AlertTriangle size={15} />
                  Сайт сейчас недоступен для пользователей
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Текст сообщения</label>
                  <textarea
                    className={styles.textarea}
                    value={settings.maintenance_message || ''}
                    onChange={(e) => setSettings({ ...settings, maintenance_message: e.target.value || null })}
                    placeholder="Сайт временно недоступен. Ведутся технические работы."
                    rows={3}
                  />
                </div>
              </>
            )}

            <button type="submit" className={styles.saveBtn} disabled={isSaving}>
              <Save size={16} />
              {isSaving ? 'Сохранение...' : 'Сохранить настройки'}
            </button>
          </div>

          {/* Инфо */}
          <div className={styles.card}>
            <div className={styles.cardTitle}>
              <Info size={13} /> Информация
            </div>

            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Версия</span>
              <span className={styles.infoValue}>1.0.0</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Окружение</span>
              <span className={`${styles.infoValue} ${styles.infoValueGreen}`}>{process.env.NODE_ENV}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>API</span>
              <span className={styles.infoValue}>{process.env.NEXT_PUBLIC_API_URL}</span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Discord</span>
              <span className={`${styles.infoValue} ${settings.discord_join_url ? styles.infoValueGreen : ''}`}>
                {settings.discord_join_url ? 'Настроен' : 'Не задан'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Telegram</span>
              <span className={`${styles.infoValue} ${settings.telegram_url ? styles.infoValueGreen : ''}`}>
                {settings.telegram_url ? 'Настроен' : 'Не задан'}
              </span>
            </div>
            <div className={styles.infoRow}>
              <span className={styles.infoKey}>Тех. режим</span>
              <span className={`${styles.infoValue} ${settings.maintenance_enabled ? '' : styles.infoValueGreen}`}
                style={settings.maintenance_enabled ? { color: '#ffa000' } : {}}>
                {settings.maintenance_enabled ? 'Включён' : 'Выключен'}
              </span>
            </div>
          </div>

        </div>
      </form>
    </div>
  )
}
