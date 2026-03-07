'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Global error:', error)
  }, [error])

  return (
    <html lang="ru">
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        background: '#0a0a0a',
        color: '#ffffff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div style={{
          maxWidth: '600px',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <div style={{
            color: '#ff4444',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'center',
          }}>
            <AlertTriangle size={64} />
          </div>
          
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 800,
            marginBottom: '1rem',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
          }}>
            Критическая ошибка
          </h1>
          
          <p style={{
            color: '#999',
            fontSize: '1.125rem',
            lineHeight: 1.6,
            marginBottom: '2rem',
          }}>
            Произошла критическая ошибка приложения. Пожалуйста, перезагрузите страницу.
          </p>

          <button
            onClick={reset}
            style={{
              background: '#4aff75',
              color: '#0a0a0a',
              border: 'none',
              padding: '1rem 2rem',
              fontSize: '1rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              cursor: 'pointer',
              borderRadius: '4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(74, 255, 117, 0.4)'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <RefreshCw size={20} />
            Перезагрузить
          </button>
        </div>
      </body>
    </html>
  )
}
