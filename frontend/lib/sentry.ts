/**
 * Sentry configuration для error tracking
 * 
 * Установка:
 * npm install @sentry/nextjs
 * npx @sentry/wizard@latest -i nextjs
 */

/**
 * Инициализация Sentry (вызывается в sentry.client.config.ts)
 */
export function initSentry() {
  // Конфигурация будет в sentry.client.config.ts после установки
  // Этот файл - placeholder для документации
}

/**
 * Отправка ошибки в Sentry вручную
 */
export function captureError(error: Error, context?: Record<string, any>) {
  if (process.env.NODE_ENV === 'development') {
    console.error('[Sentry]', error, context)
    return
  }

  // После установки @sentry/nextjs:
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.captureException(error, { contexts: { custom: context } })
}

/**
 * Отправка сообщения в Sentry
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[Sentry ${level}]`, message)
    return
  }

  // После установки @sentry/nextjs:
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.captureMessage(message, level)
}

/**
 * Установка пользовательского контекста
 */
export function setUserContext(user: { id: string; username?: string; email?: string }) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry] User context:', user)
    return
  }

  // После установки @sentry/nextjs:
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.setUser(user)
}

/**
 * Очистка пользовательского контекста
 */
export function clearUserContext() {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Sentry] User context cleared')
    return
  }

  // После установки @sentry/nextjs:
  // import * as Sentry from '@sentry/nextjs'
  // Sentry.setUser(null)
}
