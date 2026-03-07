import { Skeleton, SkeletonText } from '../ui/Skeleton'
import styles from './Skeletons.module.css'

export function AdminTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className={styles.adminTable}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={styles.adminRow}>
          <div className={styles.adminRowContent}>
            <Skeleton variant="text" height="1.25rem" width="60%" />
            <SkeletonText lines={1} />
          </div>
          <div className={styles.adminRowActions}>
            <Skeleton width="80px" height="32px" borderRadius="4px" />
            <Skeleton width="80px" height="32px" borderRadius="4px" />
          </div>
        </div>
      ))}
    </div>
  )
}
