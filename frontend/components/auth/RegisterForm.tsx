'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import styles from './AuthForm.module.css'

interface RegisterFormProps {
  onSuccess: (token: string) => void
  onSwitchToLogin: () => void
  apiUrl: string
}

export function RegisterForm({ onSuccess, apiUrl }: RegisterFormProps) {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Валидация
    if (password !== confirmPassword) {
      setError('Пароли не совпадают')
      return
    }

    if (password.length < 6) {
      setError('Пароль должен быть минимум 6 символов')
      return
    }

    if (username.length < 3) {
      setError('Никнейм должен быть минимум 3 символа')
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(`${apiUrl}/api/auth/register`, {
        username,
        email,
        password
      })

      if (response.data.access_token) {
        localStorage.setItem('lesnaya_token', response.data.access_token)
        
        // Показываем user_tag если есть
        if (response.data.user?.user_tag) {
          alert(`✅ Регистрация успешна!\n\nВаш уникальный ID: ${response.data.user.user_tag}`)
        }
        
        onSuccess(response.data.access_token)
      }
    } catch (err: any) {
      if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Ошибка регистрации. Попробуйте позже.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.formContainer}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h2 className={styles.title}>Создайте учетную запись</h2>
          <p className={styles.subtitle}>
            Зарегистрируйтесь на нашем сайте, чтобы получить полный доступ ко всему его возможностям и убрать ограничения!
          </p>
        
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.inputGroup}>
              <label htmlFor="username" className={styles.label}>
                Имя пользователя <span className={styles.required}>*</span>
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                placeholder="Введите имя пользователя"
                required
                minLength={3}
                maxLength={50}
                disabled={loading}
              />
              <p className={styles.hint}>Никнейм не должен содержать прописных символов</p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="email" className={styles.label}>
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={styles.input}
                placeholder="Введите email"
                required
                disabled={loading}
              />
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="password" className={styles.label}>
                Пароль
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={styles.input}
                placeholder="Введите пароль"
                required
                minLength={6}
                disabled={loading}
              />
              <p className={styles.hint}>Пароль должен содержать минимум 6 символов</p>
            </div>

            <div className={styles.inputGroup}>
              <label htmlFor="confirmPassword" className={styles.label}>
                Подтвердите пароль
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={styles.input}
                placeholder="Подтверждение пароля"
                required
                minLength={6}
                disabled={loading}
              />
            </div>

            {error && (
              <div className={styles.error}>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <div>{error}</div>
                </motion.div>
              </div>
            )}

            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Регистрация...' : 'Зарегистрироваться'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
