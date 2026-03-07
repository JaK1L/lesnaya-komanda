import { ButtonHTMLAttributes, ReactNode } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'default'
  size?: 'small' | 'default' | 'large'
  href?: string
  target?: string
  rel?: string
}

export function Button({
  children,
  variant = 'default',
  size = 'default',
  href,
  target,
  rel,
  className = '',
  ...props
}: ButtonProps) {
  const classNames = [
    styles.button,
    styles[variant],
    styles[size],
    className
  ].filter(Boolean).join(' ')

  // Если передан href, рендерим как ссылку
  if (href) {
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={classNames}
      >
        {children}
      </a>
    )
  }

  // Иначе как кнопку
  return (
    <button
      className={classNames}
      {...props}
    >
      {children}
    </button>
  )
}
