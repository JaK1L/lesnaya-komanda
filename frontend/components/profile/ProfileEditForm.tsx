import { Upload, Loader2 } from 'lucide-react'
import { Button } from '../ui/Button/Button'
import styles from './ProfileEditForm.module.css'

interface ProfileEditFormProps {
  siteNickname: string
  age: number | null
  bio: string
  isHidden: boolean
  saving: boolean
  onSiteNicknameChange: (value: string) => void
  onAgeChange: (value: number | null) => void
  onBioChange: (value: string) => void
  onIsHiddenChange: (value: boolean) => void
  onAvatarFileChange: (file: File | null) => void
  onSave: () => void
  placeholderUsername: string
}

export function ProfileEditForm({
  siteNickname,
  age,
  bio,
  isHidden,
  saving,
  onSiteNicknameChange,
  onAgeChange,
  onBioChange,
  onIsHiddenChange,
  onAvatarFileChange,
  onSave,
  placeholderUsername
}: ProfileEditFormProps) {
  const bioLength = bio.length
  const bioMaxLength = 500

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validation
    if (file.size > 5 * 1024 * 1024) {
      alert('Размер файла не должен превышать 5MB')
      return
    }

    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      alert('Поддерживаются только форматы: JPEG, PNG, GIF, WebP')
      return
    }

    onAvatarFileChange(file)
  }

  return (
    <div className={styles.form}>
      <h3 className={styles.title}>РЕДАКТИРОВАНИЕ ПРОФИЛЯ</h3>

      {/* Site Nickname */}
      <div className={styles.field}>
        <label className={styles.label}>
          Никнейм на сайте
        </label>
        <input
          type="text"
          value={siteNickname}
          onChange={(e) => onSiteNicknameChange(e.target.value)}
          placeholder={placeholderUsername}
          maxLength={50}
          className={styles.input}
        />
      </div>

      {/* Age */}
      <div className={styles.field}>
        <label className={styles.label}>
          Возраст
        </label>
        <input
          type="number"
          value={age || ''}
          onChange={(e) => onAgeChange(e.target.value ? parseInt(e.target.value) : null)}
          placeholder="Укажите ваш возраст"
          min="1"
          max="120"
          className={styles.input}
        />
      </div>

      {/* Bio */}
      <div className={styles.field}>
        <label className={styles.label}>
          О себе
        </label>
        <textarea
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          placeholder="Расскажите о себе..."
          maxLength={bioMaxLength}
          rows={4}
          className={styles.textarea}
        />
        <div className={`${styles.charCount} ${bioLength > 450 ? styles.warning : ''}`}>
          {bioLength} / {bioMaxLength} символов
        </div>
      </div>

      {/* Avatar Upload */}
      <div className={styles.field}>
        <label className={styles.label}>
          Аватар
        </label>
        <label htmlFor="avatar-upload">
          <span className={styles.uploadButton}>
            <Upload size={16} />
            {' '}ЗАГРУЗИТЬ ФАЙЛ
          </span>
        </label>
        <input
          id="avatar-upload"
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <div className={styles.hint}>
          JPEG, PNG, GIF, WebP • Максимум 5MB
        </div>
      </div>

      {/* Privacy */}
      <div className={styles.field}>
        <label className={styles.checkbox}>
          <input
            type="checkbox"
            checked={isHidden}
            onChange={(e) => onIsHiddenChange(e.target.checked)}
            className={styles.checkboxInput}
          />
          <span className={styles.checkboxLabel}>
            Скрыть профиль из публичных списков
          </span>
        </label>
      </div>

      {/* Save Button */}
      <div className={styles.actions}>
        <Button
          onClick={onSave}
          disabled={saving}
          variant="primary"
        >
          {saving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              СОХРАНЕНИЕ...
            </>
          ) : (
            'СОХРАНИТЬ ИЗМЕНЕНИЯ'
          )}
        </Button>
      </div>
    </div>
  )
}
