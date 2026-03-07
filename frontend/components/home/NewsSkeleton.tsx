import React from 'react'
import { Skeleton } from '../ui'
import styles from './NewsSection.module.css'

export function NewsSkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.newsCard}>
          <Skeleton width="100px" height="14px" />
          <Skeleton width="200px" height="24px" />
          <Skeleton width="100%" height="16px" count={3} />
        </div>
      ))}
    </div>
  )
}
