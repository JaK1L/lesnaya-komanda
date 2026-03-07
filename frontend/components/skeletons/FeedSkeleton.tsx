import { Skeleton, SkeletonText, SkeletonAvatar } from '../ui/Skeleton'
import styles from './Skeletons.module.css'

export function FeedSkeleton() {
  return (
    <div className={styles.feedList}>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className={styles.feedItem}>
          <div className={styles.feedHeader}>
            <SkeletonAvatar size={40} />
            <div className={styles.feedHeaderText}>
              <Skeleton variant="text" height="1rem" width="150px" />
              <Skeleton variant="text" height="0.875rem" width="100px" />
            </div>
          </div>
          <SkeletonText lines={2} />
        </div>
      ))}
    </div>
  )
}
