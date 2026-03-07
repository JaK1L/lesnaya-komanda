'use client'

import { Component, ReactNode } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'
import styles from './ErrorBoundary.module.css'

interface Props {
  children: ReactNode
  pageName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Error Boundary для отдельных страниц
 * Показывает более дружелюбный UI с возможностью вернуться на главную
 */
export class PageErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`PageErrorBoundary (${this.props.pageName || 'Unknown'}) caught error:`, error, errorInfo)
    
    // Здесь можно отправить в Sentry
    // Sentry.captureException(error, { 
    //   contexts: { 
    //     react: { componentStack: errorInfo.componentStack },
    //     page: { name: this.props.pageName }
    //   } 
    // })
  }

  handleReset = () => {
    this.setState({ hasError: false })
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundary}>
          <div className={styles.content}>
            <div className={styles.icon}>
              <AlertTriangle size={64} />
            </div>
            
            <h1 className={styles.title}>Ошибка загрузки страницы</h1>
            
            <p className={styles.message}>
              {this.props.pageName 
                ? `Не удалось загрузить страницу "${this.props.pageName}"`
                : 'Произошла ошибка при загрузке страницы'
              }
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className={styles.details}>
                <summary>Детали ошибки (dev mode)</summary>
                <pre className={styles.errorStack}>
                  {this.state.error.toString()}
                </pre>
              </details>
            )}

            <div className={styles.actions}>
              <button onClick={this.handleReset} className={styles.primaryButton}>
                <RefreshCw size={20} />
                Попробовать снова
              </button>
              
              <button onClick={this.handleGoHome} className={styles.secondaryButton}>
                <Home size={20} />
                На главную
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
