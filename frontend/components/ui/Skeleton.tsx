import React from 'react'

export interface SkeletonProps {
  width?: string | number
  height?: string | number
  circle?: boolean
  className?: string
  count?: number
}

export function Skeleton({
  width = '100%',
  height = '20px',
  circle = false,
  className = '',
  count = 1,
}: SkeletonProps) {
  const skeletonStyle: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: circle ? '50%' : 'var(--radius-md)',
    background: 'linear-gradient(90deg, var(--color-white-05) 25%, var(--color-white-08) 50%, var(--color-white-05) 75%)',
    backgroundSize: '200% 100%',
    animation: 'skeleton-loading 1.5s ease-in-out infinite',
  }

  if (count > 1) {
    return (
      <>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            className={`skeleton ${className}`}
            style={skeletonStyle}
          />
        ))}
      </>
    )
  }

  return <div className={`skeleton ${className}`} style={skeletonStyle} />
}

export interface SkeletonTextProps {
  lines?: number
  className?: string
}

export function SkeletonText({ lines = 3, className = '' }: SkeletonTextProps) {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          height="16px"
          width={index === lines - 1 ? '60%' : '100%'}
          className="mb-2"
        />
      ))}
    </div>
  )
}

export interface SkeletonCardProps {
  className?: string
}

export function SkeletonCard({ className = '' }: SkeletonCardProps) {
  return (
    <div className={`card ${className}`}>
      <Skeleton height="200px" className="mb-4" />
      <Skeleton height="24px" width="70%" className="mb-2" />
      <SkeletonText lines={2} />
    </div>
  )
}
