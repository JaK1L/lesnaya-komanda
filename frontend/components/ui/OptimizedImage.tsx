import React, { useState } from 'react'
import Image from 'next/image'

export interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  fill?: boolean
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
  objectFit = 'cover',
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return (
      <div
        className={`optimized-image-placeholder ${className}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
          background: 'var(--color-white-05)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--color-white-64)',
        }}
      >
        <span>🖼️</span>
      </div>
    )
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        style={{ objectFit }}
        priority={priority}
        onLoadingComplete={() => setIsLoading(false)}
        onError={() => setHasError(true)}
      />
    )
  }

  if (!width || !height) {
    // Fallback to regular img tag if dimensions not provided
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        onError={() => setHasError(true)}
      />
    )
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'}`}
      style={{ objectFit }}
      priority={priority}
      onLoadingComplete={() => setIsLoading(false)}
      onError={() => setHasError(true)}
    />
  )
}
