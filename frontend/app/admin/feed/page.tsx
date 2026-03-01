'use client'

import { FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { MessageCircle, Trophy, Trash2, Plus } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const ADMIN_TOKEN_KEY = 'lesnaya_admin_token'
const TOKEN_KEY = 'lesnaya_token'

type FeedKind = 'post' | 'achievement'

interface FeedItem {
  id: number
  kind: FeedKind
  title: string
  content: string | null
  created_at: string
}

export default function AdminFeedPage() {
  const router = useRouter()
  const [items, setItems] = useState<FeedItem[]>([])
  const [kind, setKind] = useState<FeedKind>('post')
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getToken = () => {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(TOKEN_KEY) || localStorage.getItem(ADMIN_TOKEN_KEY)
  }

  useEffect(() => {
    const token = getToken()
    if (!token) {
      router.replace('/')
      return
    }

    const checkAdminAccess = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/profile`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        
        if (!response.data.is_admin) {
          router.replace('/profile')
          return
        }
      } catch (err) {
        console.error('Admin check error:', err)
        router.replace('/')
        return
      }
    }

    checkAdminAccess()

    const load = async () => {
      try {
        const res = await axios.get<FeedItem[]>(`${API_URL}/api/admin/feed`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setItems(res.data)
      } catch (err) {
        console.error('Load feed error:', err)
        setError('Не удалось загрузить ленту')
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
    if (!title) {
      setError('Напиши хотя бы заголовок')
      return
    }
    setSaving(true)
    try {
      const res = await axios.post<FeedItem>(
        `${API_URL}/api/admin/feed`,
        {
          kind,
          title,
          content,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      )
      setItems((prev) => [res.data, ...prev])
      setTitle('')
      setContent('')
    } catch (err) {
      console.error('Create feed error:', err)
      setError('Не удалось создать запись')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту запись?')) return
    const token = getToken()
    if (!token) {
      router.replace('/admin/login')
      return
    }
    try {
      await axios.delete(`${API_URL}/api/admin/feed/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setItems((prev) => prev.filter((i) => i.id !== id))
    } catch (err) {
      console.error('Delete feed error:', err)
      setError('Не удалось удалить запись')
    }
  }

  const posts = items.filter((i) => i.kind === 'post')
  const achievements = items.filter((i) => i.kind === 'achievement')

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
          Лента
        </div>
        <h1 className="text-3xl mb-2">Что происходит в лесу</h1>
        <p className="text-sm text-gray-400 max-w-xl">
          Короткие посты и достижения, которые сразу попадают на главную: блок «Что происходит в
          стае» и «Достижения».
        </p>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <form onSubmit={handleCreate} className="lunacy-card space-y-4">
        <div className="flex items-center gap-3 text-sm text-gray-400">
          <Plus size={16} />
          <span>Новая запись</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as FeedKind)}
            className="bg-black border border-[var(--gray-light)] rounded-md px-2 py-1 text-xs outline-none"
          >
            <option value="post">Пост (что происходит)</option>
            <option value="achievement">Достижение</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
            Заголовок / короткая фраза
          </label>
          <input
            type="text"
            className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              kind === 'post'
                ? 'Сегодня в 22:00 собираем замес в CS2'
                : 'Вася затащил клатч 1v3 на Inferno'
            }
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
            Текст (опционально)
          </label>
          <textarea
            className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] min-h-[80px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Подробнее про событие или достижение..."
          />
        </div>

        <button
          type="submit"
          disabled={saving}
          className="lunacy-button flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {saving ? 'СОХРАНЯЕМ...' : 'ДОБАВИТЬ В ЛЕНТУ'}
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <MessageCircle size={16} /> Посты «Что происходит в лесу»
          </div>
          {loading && <div className="text-sm text-gray-500">Загружаем...</div>}
          {!loading && posts.length === 0 && (
            <div className="text-sm text-gray-500">Постов пока нет.</div>
          )}
          <div className="space-y-2">
            {posts.map((item) => {
              const dateLabel = new Date(item.created_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <div
                  key={item.id}
                  className="lunacy-card flex items-start justify-between gap-4 py-3 px-4"
                >
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{dateLabel}</div>
                    <div className="text-sm text-gray-100">{item.title}</div>
                    {item.content && (
                      <div className="text-xs text-gray-400 mt-1 whitespace-pre-line">
                        {item.content}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-1">
            <Trophy size={16} /> Достижения
          </div>
          {loading && <div className="text-sm text-gray-500">Загружаем...</div>}
          {!loading && achievements.length === 0 && (
            <div className="text-sm text-gray-500">Достижений пока нет.</div>
          )}
          <div className="space-y-2">
            {achievements.map((item) => {
              const dateLabel = new Date(item.created_at).toLocaleString('ru-RU', {
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })
              return (
                <div
                  key={item.id}
                  className="lunacy-card flex items-start justify-between gap-4 py-3 px-4"
                >
                  <div>
                    <div className="text-xs text-gray-500 mb-1">{dateLabel}</div>
                    <div className="text-sm text-gray-100">{item.title}</div>
                    {item.content && (
                      <div className="text-xs text-gray-400 mt-1 whitespace-pre-line">
                        {item.content}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="text-xs text-gray-500 hover:text-red-400"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

