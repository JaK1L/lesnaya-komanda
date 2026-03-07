import styles from './Icon.module.css'

export type IconName = 
  | 'home' | 'team' | 'streams' | 'games' | 'news' | 'contact'
  | 'twitch' | 'youtube' | 'discord' | 'telegram' | 'vk' | 'instagram'
  | 'dota2' | 'cs2' | 'trophy' | 'tournament' | 'statistics' | 'rating'
  | 'settings' | 'donate' | 'profile' | 'favorite' | 'notification'
  | 'search' | 'fire' | 'moreFunc' | 'laugh' | 'shock' | 'calendar'
  | 'chat' | 'like' | 'applause' | 'hype' | 'tree' | 'leaf'
  | 'bonus1' | 'bonus2'

export type IconSize = 'small' | 'medium' | 'large' | 'xlarge'

interface IconProps {
  name: IconName
  size?: IconSize
  className?: string
  alt?: string
}

export function Icon({ name, size = 'medium', className = '', alt }: IconProps) {
  const iconClass = `${styles.icon} ${styles[name]} ${styles[size]} ${className}`
  
  return (
    <span 
      className={iconClass}
      role="img"
      aria-label={alt || name}
      title={alt || name}
    />
  )
}
