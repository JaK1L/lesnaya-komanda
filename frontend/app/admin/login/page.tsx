'use client'

import { FormEvent, useState } from 'react'
import axios from 'axios'
import { useRouter } from 'next/navigation'
import { Shield } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const ADMIN_TOKEN_KEY = 'lesnaya_admin_token'

export default function AdminLoginPage() {
  const router = useRouter()
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const res = await axios.post<{ access_token: string; token_type: string }>(
        `${API_URL}/api/token`,
        {
          username,
          password,
        }
      )

      const token = res.data.access_token
      if (typeof window !== 'undefined') {
        localStorage.setItem(ADMIN_TOKEN_KEY, token)
      }

      router.push('/admin')
    } catch (err) {
      console.error('Admin login error:', err)
      setError('Неверный логин или пароль')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="max-w-md w-full bg-[var(--gray)] border border-[var(--gray-light)] p-8 rounded-xl shadow-lg space-y-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-dark)] flex items-center justify-center">
            <Shield className="text-[var(--accent)]" size={20} />
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-gray-400">ЛЕСНАЯ КОМАНДА</div>
            <h1 className="text-2xl mt-1">Вход в админку</h1>
          </div>
        </div>

        <p className="text-sm text-gray-400">
          Логин по локальной учётке администратора. По умолчанию создаётся пользователь{' '}
          <span className="font-mono text-[var(--accent)]">admin / admin123</span>.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
              Логин
            </label>
            <input
              type="text"
              className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-xs uppercase tracking-[0.2em] text-gray-400">
              Пароль
            </label>
            <input
              type="password"
              className="w-full bg-black border border-[var(--gray-light)] rounded-md px-3 py-2 text-sm outline-none focus:border-[var(--accent)]"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          {error && <div className="text-sm text-red-400">{error}</div>}

          <button
            type="submit"
            disabled={loading}
            className="w-full lunacy-button text-center disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'ВХОД...' : 'ВОЙТИ В АДМИНКУ'}
          </button>
        </form>
      </div>
    </div>
  )
}

