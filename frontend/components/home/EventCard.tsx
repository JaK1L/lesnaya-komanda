import styles from './EventCard.module.css'

interface EventCardProps {
  id: number
  title: string
  description: string
  game: string | null
  event_date: string | null
  telegram_url: string | null
  onClick: () => void
}

export function EventCard({ title, description, game, event_date, telegram_url, onClick }: EventCardProps) {
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

  const getStatus = (dateString: string | null) => {
    if (!dateString) return { text: 'Планируется', className: styles.statusPlanned }
    
    const date = new Date(dateString)
    const now = new Date()
    const diffHours = (date.getTime() - now.getTime()) / (1000 * 60 * 60)
    
    if (diffHours < 0 && diffHours > -3) {
      return { text: 'Идет сейчас', className: styles.statusLive }
    } else if (diffHours < 0) {
      return { text: 'Завершено', className: styles.statusCompleted }
    } else if (diffHours < 24) {
      return { text: 'Скоро', className: styles.statusOpen }
    } else {
      return { text: 'Планируется', className: styles.statusPlanned }
    }
  }

  const status = getStatus(event_date)

  return (
    <article className={styles.card} onClick={onClick}>
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
          {telegram_url && (
            <div className={styles.telegramHint}>
              Подробнее в Telegram →
            </div>
          )}
        </div>
        <span className={`${styles.status} ${status.className}`}>
          {status.text}
        </span>
      </div>
    </article>
  )
}
