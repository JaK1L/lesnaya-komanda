/**
 * Analytics utilities для отслеживания событий и метрик
 */

// Типы событий
export type AnalyticsEvent = 
  | 'page_view'
  | 'button_click'
  | 'link_click'
  | 'form_submit'
  | 'error'
  | 'user_login'
  | 'user_logout'
  | 'profile_edit'
  | 'game_preference_update'

interface AnalyticsEventData {
  event: AnalyticsEvent
  properties?: Record<string, any>
  timestamp?: number
}

/**
 * Отправка события в аналитику
 */
export function trackEvent(event: AnalyticsEvent, properties?: Record<string, any>) {
  const eventData: AnalyticsEventData = {
    event,
    ...(properties && { properties }),
    timestamp: Date.now(),
  }

  // Google Analytics (gtag)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', event, properties)
  }

  // Yandex Metrika
  if (typeof window !== 'undefined' && (window as any).ym) {
    (window as any).ym(process.env.NEXT_PUBLIC_YM_ID, 'reachGoal', event, properties)
  }

  // Console log в dev режиме
  if (process.env.NODE_ENV === 'development') {
    console.log('[Analytics]', eventData)
  }
}

/**
 * Отслеживание просмотра страницы
 */
export function trackPageView(url: string, title?: string) {
  trackEvent('page_view', {
    page_path: url,
    page_title: title || document.title,
  })
}

/**
 * Отслеживание клика по кнопке
 */
export function trackButtonClick(buttonName: string, location?: string) {
  trackEvent('button_click', {
    button_name: buttonName,
    location,
  })
}

/**
 * Отслеживание ошибки
 */
export function trackError(error: Error, context?: string) {
  trackEvent('error', {
    error_message: error.message,
    error_stack: error.stack,
    context,
  })
}

/**
 * Отслеживание пользовательского действия
 */
export function trackUserAction(action: string, details?: Record<string, any>) {
  trackEvent('button_click', {
    action,
    ...details,
  })
}
