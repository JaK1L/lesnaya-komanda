'use client'

import { useEffect } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import { Button } from '../components/ui/Button/Button'
import styles from './error.module.css'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Логируем ошибку
    console.error('Page error:', error)
    
    // Здесь можно отправить в Sentry/LogRocket
    // Sentry.captureException(error)
  }, [error])

  return (
    <div className={styles.error}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <AlertTriangle size={64} />
        </div>
        
        <h1 className={styles.title}>Упс! Что-то пошло не так</h1>
        
        <p className={styles.message}>
          Произошла ошибка при загрузке страницы. Попробуйте обновить страницу или вернуться на главную.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <details className={styles.details}>
            <summary>Детали ошибки (dev mode)</summary>
            <pre className={styles.errorStack}>
              {error.message}
              {error.digest && `\nDigest: ${error.digest}`}
            </pre>
          </details>
        )}

        <div className={styles.actions}>
          <Button onClick={reset} variant="primary">
            <RefreshCw size={20} />
            Попробовать снова
          </Button>
          
          <Button href="/" variant="secondary">
            <Home size={20} />
            На главную
          </Button>
        </div>
      </div>
    </div>
  )
}
