'use client'

import React from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from '../Button/Button'
import styles from './ErrorMessage.module.css'

interface ErrorMessageProps {
  message?: string
  onRetry?: () => void
  title?: string
}

export function ErrorMessage({ 
  message = 'Что-то пошло не так. Попробуйте еще раз.',
  onRetry,
  title = 'Ошибка'
}: ErrorMessageProps) {
  return (
    <div className={styles.error} role="alert" aria-live="assertive">
      <div className={styles.icon}>
        <AlertCircle size={48} />
      </div>
      <h3 className={styles.title}>{title}</h3>
      <p className={styles.message}>{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="primary">
          Попробовать снова
        </Button>
      )}
    </div>
  )
}
