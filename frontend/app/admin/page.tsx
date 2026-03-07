'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from './page.module.css'

export default function AdminPage() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    // Проверяем есть ли токен
    const token = localStorage.getItem('admin_token')
    if (token) {
      setIsAuthenticated(true)
    }
    setIsLoading(false)
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL
      console.log('Attempting login with:', { username, api_url: apiUrl })
      
      const response = await fetch(`${apiUrl}/api/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username,
          password,
        }),
      })

      console.log('Login response status:', response.status)

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Login failed:', errorText)
        throw new Error('Неверный логин или пароль')
      }

      const data = await response.json()
      console.log('Login successful, token received:', data.access_token ? 'yes' : 'no')
      
      localStorage.setItem('admin_token', data.access_token)
      setIsAuthenticated(true)
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
    )
  }

  return (
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
              <div className={styles.statValue}>-</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📅</div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>События</div>
              <div className={styles.statValue}>-</div>
            </div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statIcon}>📝</div>
            <div className={styles.statInfo}>
              <div className={styles.statLabel}>Записи ленты</div>
              <div className={styles.statValue}>-</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
