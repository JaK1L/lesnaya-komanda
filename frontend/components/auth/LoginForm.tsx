'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import axios from 'axios'
import styles from './AuthForm.module.css'

interface LoginFormProps {
  onSuccess: (token: string) => void
  onSwitchToRegister: () => void
  apiUrl: string
}

export function LoginForm({ onSuccess, onSwitchToRegister, apiUrl }: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await axios.post(`${apiUrl}/api/auth/token`, {
        email,
        password
      })

      if (response.data.access_token) {
        localStorage.setItem('lesnaya_token', response.data.access_token)
        onSuccess(response.data.access_token)
      }
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('Неверный email или пароль')
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail)
      } else {
        setError('Ошибка входа. Попробуйте позже.')
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
          <h2 className={styles.title}>Авторизация в аккаунт</h2>
        
          <form onSubmit={handleSubmit} className={styles.form}>
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
                autoComplete="email"
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
                disabled={loading}
                autoComplete="current-password"
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
              {loading ? 'Вход...' : 'Войти'}
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
