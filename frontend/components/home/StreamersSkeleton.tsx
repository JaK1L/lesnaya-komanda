import React from 'react'
import { Skeleton } from '../ui'
import styles from './StreamersSection.module.css'

export function StreamersSkeleton() {
  return (
    <div className={styles.grid}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.streamerCard}>
          <div className={styles.avatarWrapper}>
            <Skeleton variant="circular" width="100px" height="100px" />
          </div>
          <Skeleton width="150px" height="24px" />
          <Skeleton width="100px" height="16px" />
          <Skeleton width="80px" height="16px" />
        </div>
      ))}
    </div>
  )
}
