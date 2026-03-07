import dynamic from 'next/dynamic'
import { ComponentType, ReactElement } from 'react'
import { Skeleton } from '../components/ui'

/**
 * Утилита для lazy loading компонентов с кастомным loading state
 */
export function lazyLoad<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  options?: {
    loading?: () => ReactElement
    ssr?: boolean
  }
) {
  return dynamic(importFunc, {
    loading: options?.loading || (() => <Skeleton width="100%" height="200px" />),
    ssr: options?.ssr ?? false,
  })
}

/**
 * Lazy load для модальных окон
 */
export function lazyLoadModal<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return dynamic(importFunc, {
    loading: () => (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div style={{ width: '90%', maxWidth: '800px' }}>
          <Skeleton width="100%" height="80vh" />
        </div>
      </div>
    ),
    ssr: false,
  })
}

/**
 * Lazy load для тяжелых компонентов (charts, editors, etc)
 */
export function lazyLoadHeavy<T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>
) {
  return dynamic(importFunc, {
    loading: () => (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <Skeleton width="300px" height="300px" />
          <p style={{ color: '#666', marginTop: '1rem' }}>Загрузка...</p>
        </div>
      </div>
    ),
    ssr: false,
  })
}
