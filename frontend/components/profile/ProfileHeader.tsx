import { Button } from '../ui/Button/Button'
import styles from './ProfileHeader.module.css'

interface ProfileHeaderProps {
  nickname: string | null
  username: string
  avatarUrl: string | null
  bio: string | null
  age: number | null
  isEditMode: boolean
  onToggleEdit: () => void
}

export function ProfileHeader({
  nickname,
  username,
  avatarUrl,
  bio,
  age,
  isEditMode,
  onToggleEdit
}: ProfileHeaderProps) {
  return (
    <div className={styles.header}>
      <div className={styles.content}>
        {/* Avatar */}
        <div className={styles.avatarWrapper}>
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="Avatar"
              className={styles.avatar}
            />
          ) : (
            <div className={styles.avatarPlaceholder}>
              {username[0] || '?'}
            </div>
          )}
        </div>

        {/* Info */}
        <div className={styles.info}>
          <div className={styles.nickname}>
            {nickname || username}
          </div>
          <div className={styles.username}>
            {username}
          </div>
          {age && (
            <div className={styles.age}>
              {age} лет
            </div>
          )}

          {/* Bio */}
          <div className={styles.bioSection}>
            <div className={styles.bioLabel}>
              Информация о себе
            </div>
            <div className={styles.bioText}>
              {bio ? (
                bio
              ) : (
                <span className={styles.bioEmpty}>
                  Пользователь пока ничего не рассказал о себе
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Edit Button */}
        <div className={styles.actions}>
          <Button onClick={onToggleEdit}>
            {isEditMode ? 'ОТМЕНИТЬ' : 'РЕДАКТИРОВАТЬ ПРОФИЛЬ'}
          </Button>
        </div>
      </div>
    </div>
  )
}
