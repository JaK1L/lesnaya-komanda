import { Skeleton, SkeletonText } from '../ui/Skeleton'
import styles from './Skeletons.module.css'

export function EventsSkeleton() {
  return (
    <div className={styles.eventsGrid}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.eventCard}>
          <div className={styles.eventHeader}>
            <Skeleton variant="text" height="1.5rem" width="70%" />
            <Skeleton variant="text" height="1rem" width="30%" />
          </div>
          <SkeletonText lines={2} />
          <div className={styles.eventFooter}>
            <Skeleton width="100px" height="36px" borderRadius="8px" />
            <Skeleton variant="text" width="80px" />
          </div>
        </div>
      ))}
    </div>
  )
}
