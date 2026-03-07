import { ButtonHTMLAttributes, ReactNode, memo } from 'react'
import styles from './Button.module.css'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'secondary' | 'default'
  size?: 'small' | 'default' | 'large'
  href?: string
  target?: string
  rel?: string
  isLoading?: boolean
}

export const Button = memo(function Button({
  children,
  variant = 'default',
  size = 'default',
  href,
  target,
  rel,
  className = '',
  isLoading = false,
  disabled,
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
        rel={target === '_blank' ? 'noopener noreferrer' : rel}
        className={classNames}
        aria-disabled={disabled || isLoading}
        tabIndex={disabled || isLoading ? -1 : 0}
      >
        {isLoading ? 'Загрузка...' : children}
      </a>
    )
  }

  // Иначе как кнопку
  return (
    <button
      className={classNames}
      disabled={disabled || isLoading}
      aria-busy={isLoading}
      type={props.type || 'button'}
      {...props}
    >
      {isLoading ? 'Загрузка...' : children}
    </button>
  )
})
