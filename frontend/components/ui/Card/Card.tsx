import { ReactNode, HTMLAttributes } from 'react'
import styles from './Card.module.css'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  variant?: 'default' | 'bordered' | 'elevated'
  clickable?: boolean
  href?: string
}

export function Card({
  children,
  variant = 'default',
  clickable = false,
  href,
  className = '',
  ...props
}: CardProps) {
  const classNames = [
    styles.card,
    variant !== 'default' && styles[variant],
    clickable && styles.clickable,
    className
  ].filter(Boolean).join(' ')

  // Если передан href, рендерим как ссылку
  if (href) {
    return (
      <a
        href={href}
        className={classNames}
        style={{ textDecoration: 'none', color: 'inherit' }}
        {...props}
      >
        {children}
      </a>
    )
  }

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  )
}
