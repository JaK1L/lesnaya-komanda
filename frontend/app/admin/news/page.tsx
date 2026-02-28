'use client'

import { FormEvent, useEffect, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Newspaper, Trash2, Plus } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const ADMIN_TOKEN_KEY = 'lesnaya_admin_token'

interface NewsItem {
  id: number
  title: string
  content: string
  published: boolean
  created_at: string
}

export default function AdminNewsPage() {
  const router = useRouter()
  const [news, setNews] = useState<NewsItem[]>([])
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [published, setPublished] = useState(true)
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
        const res = await axios.get<NewsItem[]>(`${API_URL}/api/admin/news`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setNews(res.data)
      } catch (err) {
        console.error('Load news error:', err)
        setError('Не удалось загрузить новости')
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
    if (!title || !content) {
      setError('Заполни заголовок и текст')
      return
    }
    setSaving(true)
    try {
      const res = await axios.post<NewsItem>(
        `${API_URL}/api/admin/news`,
        {
          title,
          content,
          published,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setNews((prev) => [res.data, ...prev])
      setTitle('')
      setContent('')
    } catch (err) {
      console.error('Create news error:', err)
      setError('Не удалось создать новость')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту новость?')) return
    const token = getToken()
    if (!token) {
      router.replace('/admin/login')
      return
    }
    try {
      await axios.delete(`${API_URL}/api/admin/news/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setNews((prev) => prev.filter((n) => n.id !== id))
    } catch (err) {
      console.error('Delete news error:', err)
      setError('Не удалось удалить новость')
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <div className="text-xs uppercase tracking-[0.2em] text-gray-400 mb-1">
          Новости
        </div>
        <h1 className="text-3xl mb-2">Лесная лента</h1>
        <p className="text-sm text-gray-400 max-w-xl">
          Здесь ты управляешь блоком новостей на сайте: анонсы, патчноуты, важные новости стаи.
        </p>
      </div>

      {error && <div className="text-sm text-red-400">{error}</div>}

      <form onSubmit={handleCreate} className="lunacy-card space-y-4">
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <Plus size={16} /> Новая новость
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
            Заголовок
          </label>
          <input
            type="text"
            className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Например: Обновление рейтингов стаи"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
            Текст
          </label>
          <textarea
            className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)] min-h-[120px]"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Пиши сюда, что происходит в стае..."
          />
        </div>

        <label className="flex items-center gap-2 text-xs text-gray-400">
          <input
            type="checkbox"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
          />
          Опубликовать сразу
        </label>

        <button
          type="submit"
          disabled={saving}
          className="lunacy-button flex items-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <Plus size={16} />
          {saving ? 'СОХРАНЯЕМ...' : 'ОПУБЛИКОВАТЬ'}
        </button>
      </form>

      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
          <Newspaper size={16} /> Все новости
        </div>

        {loading && <div className="text-sm text-gray-400">Загружаем новости...</div>}

        {!loading && news.length === 0 && (
          <div className="text-sm text-gray-500">Новостей пока нет.</div>
        )}

        <div className="space-y-2">
          {news.map((item) => {
            const dateLabel = new Date(item.created_at).toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
            })

            return (
              <div key={item.id} className="lunacy-card flex items-start justify-between gap-4">
                <div>
                  <div className="text-xs text-gray-500 mb-1">{dateLabel}</div>
                  <div className="game-name text-lg mb-1">{item.title}</div>
                  <div className="text-sm text-gray-300 whitespace-pre-line">{item.content}</div>
                  {!item.published && (
                    <div className="mt-1 text-xs text-yellow-400 uppercase tracking-[0.2em]">
                      Черновик
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleDelete(item.id)}
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

