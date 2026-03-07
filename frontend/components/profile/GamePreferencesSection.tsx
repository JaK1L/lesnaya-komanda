import { Gamepad2 } from 'lucide-react'
import { VALID_GAMES } from '../../types/gamePreferences'
import styles from './GamePreferencesSection.module.css'

interface GamePreferencesSectionProps {
  selectedGames: Set<string>
  customGameName: string
  onGameToggle: (game: string) => void
  onCustomGameNameChange: (name: string) => void
}

export function GamePreferencesSection({
  selectedGames,
  customGameName,
  onGameToggle,
  onCustomGameNameChange
}: GamePreferencesSectionProps) {
  const hasCustomGame = selectedGames.has('Другое')
  const customGameError = hasCustomGame && !customGameName.trim()

  return (
    <div className={styles.section}>
      <h4 className={styles.title}>
        <Gamepad2 size={20} />
        ИГРОВЫЕ ПРЕДПОЧТЕНИЯ
      </h4>
      
      <p className={styles.description}>
        Выберите игры, в которые вы играете
      </p>

      <div className={styles.grid}>
        {VALID_GAMES.map((game) => (
          <label
            key={game}
            className={`${styles.gameOption} ${selectedGames.has(game) ? styles.selected : ''}`}
          >
            <input
              type="checkbox"
              checked={selectedGames.has(game)}
              onChange={() => onGameToggle(game)}
              className={styles.checkbox}
            />
            <span className={styles.gameName}>{game}</span>
          </label>
        ))}
      </div>

      {/* Custom game name input */}
      {hasCustomGame && (
        <div className={styles.customInput}>
          <label className={styles.customLabel}>
            Название игры: <span className={styles.required}>*</span>
          </label>
          <input
            type="text"
            value={customGameName}
            onChange={(e) => onCustomGameNameChange(e.target.value)}
            placeholder="Введите название игры"
            maxLength={50}
            className={`${styles.input} ${customGameError ? styles.error : ''}`}
          />
          {customGameError && (
            <div className={styles.errorText}>
              Обязательное поле для игры "Другое"
            </div>
          )}
        </div>
      )}
    </div>
  )
}
