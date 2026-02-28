'use client'

import { FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Link2, AlertTriangle } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const ADMIN_TOKEN_KEY = 'lesnaya_admin_token'

interface CommonSettings {
  discord_join_url: string
  maintenance_enabled: boolean
  maintenance_message?: string | null
}

export default function AdminSettingsPage() {
  const router = useRouter()
  const [settings, setSettings] = useState<CommonSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getToken = () =>
    typeof window !== 'undefined' ? localStorage.getItem(ADMIN_TOKEN_KEY) : null

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/admin/login')
      return
    }

    const load = async () => {
      try {
        const res = await axios.get<CommonSettings>(`${API_URL}/api/admin/settings/common`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setSettings(res.data)
      } catch (err) {
        console.error('Load settings error:', err)
        setError('Не удалось загрузить настройки')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!settings) return
    setError(null)
    const token = getToken()
    if (!token) {
      router.replace('/admin/login')
      return
    }
    setSaving(true)
    try {
      const res = await axios.put<CommonSettings>(
        `${API_URL}/api/admin/settings/common`,
        settings,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setSettings(res.data)
    } catch (err) {
      console.error('Save settings error:', err)
      setError('Не удалось сохранить настройки')
    } finally {
      setSaving(false)
    }
  }

  if (loading || !settings) {
    return <div className="text-sm text-gray-400">Загружаем настройки...</div>
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
          Настройки
        </div>
        <h1 className="text-3xl mb-2">Общие настройки сайта</h1>
        <p className="text-sm text-gray-400 max-w-xl">
          Здесь живут самые важные вещи: ссылка на Discord и режим технических работ.
        </p>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="lunacy-card space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Link2 size={16} /> ссылка «ВОЙТИ В ЛЕС»
          </div>
          <p className="text-xs text-gray-500">
            Эта ссылка используется в кнопке «ВОЙТИ В ЛЕС» на главной — обычно это инвайт на
            Discord.
          </p>
          <input
            type="text"
            className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            value={settings.discord_join_url}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, discord_join_url: e.target.value } : prev
              )
            }
            placeholder="https://discord.gg/..."
          />
        </div>

        <div className="lunacy-card space-y-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <AlertTriangle size={16} /> Технические работы
          </div>
          <label className="flex items-center gap-2 text-xs text-gray-400">
            <input
              type="checkbox"
              checked={settings.maintenance_enabled}
              onChange={(e) =>
                setSettings((prev) =>
                  prev ? { ...prev, maintenance_enabled: e.target.checked } : prev
                )
              }
            />
            Включить режим тех.работ (баннер сверху сайта)
          </label>
          <textarea
            className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] min-h-[80px]"
            value={settings.maintenance_message ?? ''}
            onChange={(e) =>
              setSettings((prev) =>
                prev ? { ...prev, maintenance_message: e.target.value } : prev
              )
            }
            placeholder="Например: Сегодня с 03:00 до 04:00 по МСК проводим тех.работы, возможны вылеты."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="lunacy-button flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? 'СОХРАНЯЕМ...' : 'СОХРАНИТЬ НАСТРОЙКИ'}
        </button>
      </form>
    </div>
  )
}

