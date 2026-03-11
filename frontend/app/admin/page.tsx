'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageErrorBoundary } from '../../components/PageErrorBoundary'
import styles from './page.module.css'

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [stats, setStats] = useState<any>(null)

  useEffect(() => {
    // Проверяем есть ли токен
    const token = localStorage.getItem('admin_token')
    if (token) {
      setIsAuthenticated(true)
      fetchStats()
    }
    setIsLoading(false)
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (err) {
      console.error('Error fetching stats:', err)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      
      const response = await fetch(`${apiUrl}/api/auth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: username, // Backend принимает email, но можно передать username
          password,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Неверный логин или пароль' }))
        throw new Error(errorData.detail || 'Неверный логин или пароль')
      }

      const data = await response.json()
      
      // Сохраняем токен и проверяем права
      localStorage.setItem('admin_token', data.access_token)
      
      // Проверяем права администратора
      const meResponse = await fetch(`${apiUrl}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${data.access_token}`,
        },
      })

      if (!meResponse.ok) {
        localStorage.removeItem('admin_token')
        throw new Error('Ошибка проверки прав доступа')
      }

      const userData = await meResponse.json()
      
      if (userData.role !== 'admin') {
        localStorage.removeItem('admin_token')
        throw new Error('У вас нет прав администратора')
      }
      
      setIsAuthenticated(true)
      fetchStats()
    } catch (err) {
      console.error('Login error:', err)
      setError(err instanceof Error ? err.message : 'Ошибка входа')
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('admin_token')
    setIsAuthenticated(false)
    setUsername('')
    setPassword('')
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <PageErrorBoundary pageName="Админ-панель (Вход)">
        <div className={styles.container}>
          <div className={styles.loginBox}>
            <h1>🌲 Админ-панель</h1>
            <p>Лесная Команда</p>
            
            <form onSubmit={handleLogin} className={styles.loginForm}>
              <div className={styles.formGroup}>
                <label htmlFor="username">Логин</label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="LesnoyBOSS"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password">Пароль</label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              {error && <div className={styles.error}>{error}</div>}

              <button type="submit" className={styles.loginButton}>
                Войти
              </button>
            </form>
          </div>
        </div>
      </PageErrorBoundary>
    )
  }

  return (
    <PageErrorBoundary pageName="Админ-панель">
      <div className={styles.container}>
        <header className={styles.header}>
          <h1>🌲 Админ-панель</h1>
          <button onClick={handleLogout} className={styles.logoutButton}>
            Выйти
          </button>
        </header>

        <nav className={styles.nav}>
          <button onClick={() => router.push('/admin/news')} className={styles.navButton}>
            📰 Новости
          </button>
          <button onClick={() => router.push('/admin/events')} className={styles.navButton}>
            📅 События
          </button>
          <button onClick={() => router.push('/admin/feed')} className={styles.navButton}>
            📝 Лента
          </button>
          <button onClick={() => router.push('/admin/users')} className={styles.navButton}>
            👥 Пользователи
          </button>
          <button onClick={() => router.push('/admin/achievements')} className={styles.navButton}>
            🏆 Достижения
          </button>
          <button onClick={() => router.push('/admin/streamers')} className={styles.navButton}>
            🎮 Стримеры
          </button>
          <button onClick={() => router.push('/admin/merch')} className={styles.navButton}>
            🛍️ Магазин
          </button>
          <button onClick={() => router.push('/admin/settings')} className={styles.navButton}>
            ⚙️ Настройки
          </button>
        </nav>

        <main className={styles.main}>
          <div className={styles.welcome}>
            <h2>Добро пожаловать!</h2>
            <p>Выберите раздел для управления контентом</p>
          </div>

          <div className={styles.stats}>
            <div className={styles.statCard}>
              <div className={styles.statIcon}>📰</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Новости</div>
                <div className={styles.statValue}>
                  {stats ? `${stats.news.published}/${stats.news.total}` : '-'}
                </div>
                {stats && <div className={styles.statSubtext}>опубликовано</div>}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📅</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>События</div>
                <div className={styles.statValue}>
                  {stats ? `${stats.events.upcoming}/${stats.events.total}` : '-'}
                </div>
                {stats && <div className={styles.statSubtext}>предстоящих</div>}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>📝</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Записи ленты</div>
                <div className={styles.statValue}>
                  {stats ? stats.feed.total : '-'}
                </div>
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>👥</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Пользователи</div>
                <div className={styles.statValue}>
                  {stats ? `${stats.users.online}/${stats.users.total}` : '-'}
                </div>
                {stats && <div className={styles.statSubtext}>онлайн</div>}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🎮</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Стримеры</div>
                <div className={styles.statValue}>
                  {stats ? `${stats.streamers.active}/${stats.streamers.total}` : '-'}
                </div>
                {stats && <div className={styles.statSubtext}>активных</div>}
              </div>
            </div>

            <div className={styles.statCard}>
              <div className={styles.statIcon}>🛍️</div>
              <div className={styles.statInfo}>
                <div className={styles.statLabel}>Товары</div>
                <div className={styles.statValue}>
                  {stats ? `${stats.merch.in_stock}/${stats.merch.total}` : '-'}
                </div>
                {stats && <div className={styles.statSubtext}>в наличии</div>}
              </div>
            </div>
          </div>
        </main>
      </div>
    </PageErrorBoundary>
  )
}
