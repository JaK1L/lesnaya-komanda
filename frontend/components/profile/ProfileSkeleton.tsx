import React from 'react'
import { Skeleton } from '../ui'
import styles from './ProfileHeader.module.css'

export function ProfileSkeleton() {
  return (
    <div className={styles.header}>
      <div className={styles.content}>
        <div className={styles.avatarWrapper}>
          <Skeleton variant="circular" width="120px" height="120px" />
        </div>
        <div className={styles.info} style={{ width: '100%' }}>
          <Skeleton width="200px" height="28px" />
          <Skeleton width="150px" height="16px" />
          <Skeleton width="100px" height="14px" />
          <div style={{ marginTop: '1rem' }}>
            <Skeleton width="100%" height="80px" />
          </div>
        </div>
      </div>
    </div>
  )
}
