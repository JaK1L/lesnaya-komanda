import styles from './EventCard.module.css'

interface EventCardProps {
  id: number
  title: string
  description: string
  game: string | null
  event_date: string | null
  telegram_url: string | null
  status: string
  max_participants: number | null
  registration_enabled: boolean
  registered_count: number
  is_registered: boolean
  can_register: boolean
  onClick: () => void
  onRegister?: () => void
  onUnregister?: () => void
  isAuthenticated: boolean
}

export function EventCard({ 
  title, 
  description, 
  game, 
  event_date, 
  telegram_url, 
  status,
  max_participants,
  registration_enabled,
  registered_count,
  is_registered,
  can_register,
  onClick,
  onRegister,
  onUnregister,
  isAuthenticated
}: EventCardProps) {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Дата уточняется'
    
    const date = new Date(dateString)
    const now = new Date()
    const isToday = date.toDateString() === now.toDateString()
    
    if (isToday) {
      return `Сегодня в ${date.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
    }
    
    return date.toLocaleString('ru-RU', {
      day: 'numeric',
      month: 'long',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusStyle = (statusText: string) => {
    const lower = statusText.toLowerCase()
    if (lower.includes('идет') || lower.includes('live')) {
      return styles.statusLive
    } else if (lower.includes('завершен') || lower.includes('completed')) {
      return styles.statusCompleted
    } else if (lower.includes('скоро') || lower.includes('open')) {
      return styles.statusOpen
    } else {
      return styles.statusPlanned
    }
  }

  const handleRegisterClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (is_registered && onUnregister) {
      onUnregister()
    } else if (onRegister) {
      onRegister()
    }
  }

  return (
    <article className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{title}</h3>
        {game && <span className={styles.gameTag}>{game}</span>}
      </div>
      
      <p className={styles.description}>{description}</p>
      
      <div className={styles.footer}>
        <div>
          <div className={styles.date}>
            📅 {formatDate(event_date)}
          </div>
          
          {registration_enabled && (
            <div className={styles.registrationInfo}>
              👥 {registered_count}
              {max_participants && ` / ${max_participants}`} участников
            </div>
          )}
          
          {telegram_url && (
            <div className={styles.telegramHint} onClick={onClick}>
              Подробнее в Telegram →
            </div>
          )}
        </div>
        
        <div className={styles.actions}>
          <span className={`${styles.status} ${getStatusStyle(status)}`}>
            {status}
          </span>
          
          {registration_enabled && isAuthenticated && (
            <button
              onClick={handleRegisterClick}
              className={is_registered ? styles.unregisterButton : styles.registerButton}
              disabled={!can_register && !is_registered}
            >
              {is_registered ? '✓ Зарегистрирован' : can_register ? 'Записаться' : 'Мест нет'}
            </button>
          )}
          
          {registration_enabled && !isAuthenticated && (
            <div className={styles.authHint}>
              Войдите для регистрации
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
