import styles from './FeedCard.module.css'

interface FeedCardProps {
  id: number
  kind: string
  title: string
  content: string | null
  created_at: string
}

export function FeedCard({ kind, title, content, created_at }: FeedCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'только что'
    if (diffMins < 60) return `${diffMins} мин назад`
    if (diffHours < 24) return `${diffHours} ч назад`
    if (diffDays < 7) return `${diffDays} дн назад`

    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    })
  }

  const getIcon = (type: string) => {
    return type === 'achievement' ? '🏆' : '📝'
  }

  const getTypeLabel = (type: string) => {
    return type === 'achievement' ? 'Достижение' : 'Пост'
  }

  const isAchievement = kind === 'achievement'

  return (
    <article className={styles.card}>
      <div className={`${styles.icon} ${isAchievement ? styles.iconAchievement : styles.iconPost}`}>
        {getIcon(kind)}
      </div>
      <div className={styles.content}>
        <div className={styles.header}>
          <h3 className={styles.title}>{title}</h3>
          <span className={`${styles.type} ${isAchievement ? styles.typeAchievement : styles.typePost}`}>
            {getTypeLabel(kind)}
          </span>
        </div>
        {content && <p className={styles.description}>{content}</p>}
        <div className={styles.date}>{formatDate(created_at)}</div>
      </div>
    </article>
  )
}
