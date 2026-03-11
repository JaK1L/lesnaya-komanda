import React from 'react'
import Link from 'next/link'

export interface ButtonProps {
  children: React.ReactNode
  variant?: 'primary' | 'secondary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
  href?: string
  onClick?: () => void
  disabled?: boolean
  type?: 'button' | 'submit' | 'reset'
  className?: string
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'right',
  href,
  onClick,
  disabled = false,
  type = 'button',
  className = '',
}: ButtonProps) {
  const classes = `btn btn-${variant} btn-${size} ${className}`

  const content = (
    <>
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </>
  )

  if (href) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button
      type={type}
      className={classes}
      onClick={onClick}
      disabled={disabled}
    >
      {content}
    </button>
  )
}

export interface IconButtonProps {
  icon: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'ghost'
  onClick?: () => void
  disabled?: boolean
  'aria-label': string
  className?: string
}

export function IconButton({
  icon,
  size = 'md',
  variant = 'secondary',
  onClick,
  disabled = false,
  'aria-label': ariaLabel,
  className = '',
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`btn btn-${variant} btn-icon btn-${size} ${className}`}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
    >
      {icon}
    </button>
  )
}
