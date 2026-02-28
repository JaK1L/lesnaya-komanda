'use client'

import { FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Calendar, Trash2, Plus } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const ADMIN_TOKEN_KEY = 'lesnaya_admin_token'

interface EventItem {
  id: number
  title: string
  description: string
  game: string
  event_date: string | null
}

export default function AdminEventsPage() {
  const router = useRouter()
  const [events, setEvents] = useState<EventItem[]>([])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [game, setGame] = useState('Общее')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('20:00')
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
        const res = await axios.get<EventItem[]>(`${API_URL}/api/admin/events`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setEvents(res.data)
      } catch (err) {
        console.error('Load events error:', err)
        setError('Не удалось загрузить события')
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [router])

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    const token = getToken()
    if (!token) {
      router.replace('/admin/login')
      return
    }
    if (!title || !date) {
      setError('Заполни название и дату')
      return
    }
    setSaving(true)
    try {
      const eventDateIso = new Date(`${date}T${time}:00`).toISOString()
      const res = await axios.post<EventItem>(
        `${API_URL}/api/admin/events`,
        {
          title,
          description,
          game,
          event_date: eventDateIso,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setEvents((prev) => [res.data, ...prev])
      setTitle('')
      setDescription('')
    } catch (err) {
      console.error('Create event error:', err)
      setError('Не удалось создать событие')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить это событие?')) return
    const token = getToken()
    if (!token) {
      router.replace('/admin/login')
      return
    }
    try {
      await axios.delete(`${API_URL}/api/admin/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setEvents((prev) => prev.filter((e) => e.id !== id))
    } catch (err) {
      console.error('Delete event error:', err)
      setError('Не удалось удалить событие')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
          События
        </div>
        <h1 className="text-3xl mb-2">Управление событиями</h1>
        <p className="text-sm text-gray-400 max-w-xl">
          Всё, что ты создаёшь здесь, уходит в блок «События в лесу» на главной странице.
        </p>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <form onSubmit={handleCreate} className="lunacy-card space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Plus size={16} /> Новое событие
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
              Название
            </label>
            <input
              type="text"
              className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="CS2 КЛАТЧ-ТУРНИР"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
              Игра / тег
            </label>
            <input
              type="text"
              className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              value={game}
              onChange={(e) => setGame(e.target.value)}
              placeholder="CS2 / DOTA 2 / VALORANT / Общее"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
              Дата
            </label>
            <input
              type="date"
              className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
              Время
            </label>
            <input
              type="time"
              className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
            Описание
          </label>
          <textarea
            className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] min-h-[80px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Например: собираем 5 стак на вечерние замесы."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="lunacy-button flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {saving ? 'СОХРАНЯЕМ...' : 'СОЗДАТЬ СОБЫТИЕ'}
        </button>
      </form>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Calendar size={16} /> Текущие события
        </div>

        {loading && <div className="text-sm text-gray-400">Загружаем список событий...</div>}

        {!loading && events.length === 0 && (
          <div className="text-sm text-gray-500">Пока нет ни одного события.</div>
        )}

        <div className="space-y-2">
          {events.map((event) => {
            const dateLabel = event.event_date
              ? new Date(event.event_date).toLocaleString('ru-RU', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : 'Без даты'

            return (
              <div key={event.id} className="lunacy-card flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs uppercase tracking-[0.2em] text-[var(--accent)] mb-1">
                    {event.game || 'Общее'}
                  </div>
                  <div className="game-name text-lg mb-1">{event.title}</div>
                  <div className="text-xs text-gray-500 mb-1">{dateLabel}</div>
                  <div className="text-sm text-gray-300">{event.description}</div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(event.id)}
                  className="text-xs text-gray-500 hover:text-red-400"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

