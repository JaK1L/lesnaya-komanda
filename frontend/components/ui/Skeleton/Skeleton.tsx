import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ 
  width = '100%', 
  height = '1rem', 
  borderRadius,
  className = '',
  variant = 'rectangular'
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  }

  // Variant-specific styles
  if (variant === 'text') {
    style.borderRadius = '4px'
    style.height = '1rem'
  } else if (variant === 'circular') {
    style.borderRadius = '50%'
  } else if (borderRadius !== undefined) {
    style.borderRadius = typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius
  }

  return (
    <div 
      className={`${styles.skeleton} ${styles[variant]} ${className}`}
      style={style}
      aria-busy="true"
      aria-live="polite"
    />
  )
}

// Preset skeletons for common use cases
export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={className}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          width={i === lines - 1 ? '70%' : '100%'}
          height="1rem"
          className={styles.textLine}
        />
      ))}
    </div>
  )
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`${styles.card} ${className}`}>
      <Skeleton height="200px" borderRadius="8px" className={styles.cardImage} />
      <div className={styles.cardContent}>
        <Skeleton variant="text" height="1.5rem" width="80%" />
        <Skeleton variant="text" height="1rem" width="60%" className={styles.cardSubtitle} />
        <SkeletonText lines={2} />
      </div>
    </div>
  )
}

export function SkeletonAvatar({ size = 48, className = '' }: { size?: number; className?: string }) {
  return (
    <Skeleton 
      variant="circular" 
      width={size} 
      height={size}
      className={className}
    />
  )
}

export function SkeletonButton({ width = '120px', className = '' }: { width?: string | number; className?: string }) {
  return (
    <Skeleton 
      width={width} 
      height="40px" 
      borderRadius="8px"
      className={className}
    />
  )
}
