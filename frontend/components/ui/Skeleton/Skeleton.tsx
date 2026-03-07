import React from 'react'
import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string
  height?: string
  count?: number
  variant?: 'text' | 'circular' | 'rectangular'
  className?: string
}

export function Skeleton({ 
  width = '100%', 
  height = '20px',
  count = 1,
  variant = 'rectangular',
  className = ''
}: SkeletonProps) {
  const skeletonClass = `${styles.skeleton} ${styles[variant]} ${className}`
  
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i}
          className={skeletonClass}
          style={{ width, height }}
          aria-label="Загрузка..."
        />
      ))}
    </>
  )
}
