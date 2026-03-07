import Image from 'next/image'
import { useState } from 'react'
import styles from './OptimizedImage.module.css'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
  sizes?: string
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
}

export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  fill = false,
  sizes,
  objectFit = 'cover'
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  // Fallback для ошибок загрузки
  if (hasError) {
    return (
      <div className={`${styles.placeholder} ${className}`}>
        <span className={styles.placeholderIcon}>👤</span>
      </div>
    )
  }

  // Если fill mode
  if (fill) {
    return (
      <div className={`${styles.imageWrapper} ${className}`}>
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes || '100vw'}
          className={`${styles.image} ${isLoading ? styles.loading : styles.loaded}`}
          style={{ objectFit }}
          priority={priority}
          onLoad={() => setIsLoading(false)}
          onError={() => setHasError(true)}
          quality={90}
        />
      </div>
    )
  }

  // Обычный mode с width/height
  return (
    <Image
      src={src}
      alt={alt}
      width={width || 300}
      height={height || 300}
      className={`${styles.image} ${isLoading ? styles.loading : styles.loaded} ${className}`}
      style={{ objectFit }}
      priority={priority}
      onLoad={() => setIsLoading(false)}
      onError={() => setHasError(true)}
      quality={90}
      placeholder="blur"
      blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMzAwIiBoZWlnaHQ9IjMwMCIgZmlsbD0iIzFhMWExYSIvPjwvc3ZnPg=="
    />
  )
}
