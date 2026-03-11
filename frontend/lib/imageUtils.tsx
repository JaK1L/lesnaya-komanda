import React from 'react'

/**
 * Получает полный URL для изображения
 * Если URL относительный (начинается с /api/), добавляет базовый URL бэкенда
 */
export function getImageUrl(url: string | null | undefined): string | null {
  if (!url) return null
  
  // Если URL уже полный (начинается с http:// или https://), возвращаем как есть
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Если URL относительный, добавляем базовый URL бэкенда
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  return `${API_URL}${url}`
}

/**
 * Компонент Image с автоматической обработкой URL
 */
interface ImageWithFallbackProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> {
  src: string | null | undefined
  fallback?: React.ReactNode
}

export function ImageWithFallback({ src, fallback, alt, ...props }: ImageWithFallbackProps) {
  const imageUrl = getImageUrl(src)
  
  if (!imageUrl && fallback) {
    return <>{fallback}</>
  }
  
  if (!imageUrl) {
    return null
  }
  
  return <img src={imageUrl} alt={alt} {...props} />
}
