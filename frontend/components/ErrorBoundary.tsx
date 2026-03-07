'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './ui/Button/Button'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: React.ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Логируем ошибку
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    // Вызываем callback если передан
    this.props.onError?.(error, errorInfo)
    
    // Здесь можно отправить в Sentry/LogRocket
    // Sentry.captureException(error, { contexts: { react: { componentStack: errorInfo.componentStack } } })
    
    this.setState({ errorInfo })
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      // Если передан custom fallback, используем его
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Дефолтный fallback UI
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.content}>
            <div className={styles.icon}>
              <AlertTriangle size={64} />
            </div>
            
            <h1 className={styles.title}>Что-то пошло не так</h1>
            
            <p className={styles.message}>
              Произошла непредвиденная ошибка. Мы уже работаем над её исправлением.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.details}>
                <summary>Детали ошибки (только в dev режиме)</summary>
                <pre className={styles.errorStack}>
                  <strong>Error:</strong> {this.state.error.toString()}
                  {this.state.errorInfo && (
                    <>
                      {'\n\n'}
                      <strong>Component Stack:</strong>
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            <div className={styles.actions}>
              <Button onClick={this.handleReset} variant="primary">
                <RefreshCw size={20} />
                Попробовать снова
              </Button>
              
              <Button onClick={this.handleReload} variant="secondary">
                Перезагрузить страницу
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
