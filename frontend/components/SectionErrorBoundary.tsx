'use client'

import { Component, ReactNode } from 'react'
import { AlertCircle } from 'lucide-react'
import { Button } from './ui/Button/Button'
import styles from './SectionErrorBoundary.module.css'

interface Props {
  children: ReactNode
  sectionName?: string
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
}

/**
 * Легковесный Error Boundary для отдельных секций
 * Не ломает всю страницу, только проблемную секцию
 */
export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error(`Error in ${this.props.sectionName || 'section'}:`, error, errorInfo)
    this.props.onError?.(error, errorInfo)
  }

  handleRetry = () => {
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.sectionError}>
          <div className={styles.content}>
            <AlertCircle size={32} className={styles.icon} />
            <div className={styles.text}>
              <p className={styles.title}>
                {this.props.sectionName 
                  ? `Ошибка загрузки секции "${this.props.sectionName}"`
                  : 'Ошибка загрузки секции'
                }
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <p className={styles.errorMessage}>
                  {this.state.error.message}
                </p>
              )}
            </div>
            <Button onClick={this.handleRetry} size="small">
              Попробовать снова
            </Button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
