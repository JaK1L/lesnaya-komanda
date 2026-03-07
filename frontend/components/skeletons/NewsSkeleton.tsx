import { Skeleton, SkeletonText } from '../ui/Skeleton'
import styles from './Skeletons.module.css'

export function NewsSkeleton() {
  return (
    <div className={styles.newsGrid}>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className={styles.newsCard}>
          <Skeleton height="200px" borderRadius="8px" className={styles.newsImage} />
          <div className={styles.newsContent}>
            <Skeleton variant="text" height="1.5rem" width="90%" />
            <Skeleton variant="text" height="1rem" width="40%" className={styles.newsDate} />
            <SkeletonText lines={3} />
          </div>
        </div>
      ))}
    </div>
  )
}
