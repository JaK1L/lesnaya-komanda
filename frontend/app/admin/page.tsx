'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Users, Activity, RefreshCw } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const ADMIN_TOKEN_KEY = 'lesnaya_admin_token'

interface Stats {
  members: number
  online: number
  achievements: number
}

interface Me {
  id: number
  username: string
  role: string
}

export default function AdminDashboardPage() {
  const router = useRouter()
  const [me, setMe] = useState<Me | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const token = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (!token) {
      router.replace('/admin/login')
      return
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    }

    const load = async () => {
      try {
        const [meRes, statsRes] = await Promise.all([
          axios.get<Me>(`${API_URL}/api/me`, { headers }),
          axios.get<Stats>(`${API_URL}/api/stats`),
        ])
        setMe(meRes.data)
        setStats(statsRes.data)
      } catch (err) {
        console.error('Admin dashboard error:', err)
        setError('Сессия истекла или нет доступа. Перезайдите в админку.')
        localStorage.removeItem(ADMIN_TOKEN_KEY)
        router.replace('/admin/login')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(ADMIN_TOKEN_KEY)
    }
    router.push('/admin/login')
  }

  const handleUpdateRatings = async () => {
    if (typeof window === 'undefined') return
    const token = localStorage.getItem(ADMIN_TOKEN_KEY)
    if (!token) {
      router.replace('/admin/login')
      return
    }

    setUpdating(true)
    setError(null)
    try {
      await axios.post(
        `${API_URL}/api/update-rating`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
    } catch (err) {
      console.error('Update ratings error:', err)
      setError('Не удалось пересчитать рейтинги')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return <div className="py-10 text-gray-400">Загружаем данные админки...</div>
  }

  if (!me) {
    return <div className="py-10 text-gray-400">Нет данных пользователя</div>
  }

  return (
    <div className="space-y-8">
      {/* Верхний блок */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="text-xs uppercase tracking-[0.2em] text-gray-400">
            Панель администратора
          </div>
          <div className="text-4xl md:text-5xl font-black leading-tight">
            Привет, <span style={{ color: 'var(--accent)' }}>{me.username}</span>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Роль: {me.role}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="lunacy-button text-xs px-4 py-2"
          style={{ padding: '0.6rem 1.5rem' }}
        >
          ВЫЙТИ
        </button>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      {/* Карточки со сводкой */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="lunacy-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users size={16} /> Участники
          </div>
          <div className="stat-number text-4xl">
            {stats?.members ?? 0}
            <span className="text-base text-gray-500 ml-2">всего</span>
          </div>
        </div>

        <div className="lunacy-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity size={16} /> Онлайн
          </div>
          <div className="stat-number text-4xl">
            {stats?.online ?? 0}
            <span className="text-base text-gray-500 ml-2">сейчас</span>
          </div>
        </div>

        <div className="lunacy-card flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Activity size={16} /> Достижения
          </div>
          <div className="stat-number text-4xl">
            {stats?.achievements ?? 0}
            <span className="text-base text-gray-500 ml-2">записей</span>
          </div>
        </div>
      </div>

      <div className="lunacy-card flex items-center justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
            Рейтинги игроков
          </div>
          <p className="text-sm text-gray-400">
            Пересчитать рейтинг для всех игроков на основе сообщений, голосовой активности и
            достижений.
          </p>
        </div>
        <button
          type="button"
          onClick={handleUpdateRatings}
          disabled={updating}
          className="lunacy-button flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} />
          {updating ? 'СЧИТАЕМ...' : 'ПЕРЕСЧИТАТЬ РЕЙТИНГИ'}
        </button>
      </div>
    </div>
  )
}

