'use client'

import { Calendar, Radio, Swords, Trophy, X } from 'lucide-react'
import styles from './TournamentBracket.module.css'
import type { BracketMatchData } from './types'

interface Props {
  match: BracketMatchData | null
  onClose: () => void
}

function formatDate(value?: string | null) {
  if (!value) return 'Время не указано'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusLabel(status: BracketMatchData['status']) {
  switch (status) {
    case 'live':
      return 'Идет сейчас'
    case 'finished':
      return 'Завершен'
    case 'cancelled':
      return 'Отменен'
    case 'bye':
      return 'Автопроход'
    case 'pending':
      return 'Ожидает соперника'
    default:
      return 'Скоро'
  }
}

export default function BracketMatchDetails({ match, onClose }: Props) {
  if (!match) return null

  return (
    <div className={styles.detailsOverlay} onClick={event => event.target === event.currentTarget && onClose()}>
      <div className={styles.detailsPanel}>
        <div className={styles.detailsHeader}>
          <div>
            <p className={styles.detailsEyebrow}>Матч {match.position}</p>
            <h3 className={styles.detailsTitle}>Детали матча</h3>
          </div>
          <button type="button" className={styles.detailsClose} onClick={onClose} aria-label="Закрыть">
            <X size={18} />
          </button>
        </div>

        <div className={styles.detailsMeta}>
          <span className={styles.detailsMetaItem}>
            <Radio size={14} />
            {getStatusLabel(match.status)}
          </span>
          <span className={styles.detailsMetaItem}>
            <Calendar size={14} />
            {formatDate(match.startTime)}
          </span>
          <span className={styles.detailsMetaItem}>
            <Swords size={14} />
            {match.matchFormat ?? 'Формат не указан'}
          </span>
        </div>

        <div className={styles.detailsParticipants}>
          {match.participants.map((participant, index) => (
            <div
              key={`${match.id}-${index}`}
              className={[
                styles.detailsParticipant,
                participant.isWinner ? styles.detailsParticipantWinner : '',
                participant.isTBD || participant.isBye ? styles.detailsParticipantMuted : '',
              ].filter(Boolean).join(' ')}
            >
              <div>
                <div className={styles.detailsParticipantName}>{participant.name}</div>
                <div className={styles.detailsParticipantHint}>
                  {participant.isBye ? 'Автопроход' : participant.isTBD ? 'Участник определится позже' : 'Подтвержденный участник'}
                </div>
              </div>
              <div className={styles.detailsParticipantRight}>
                {typeof participant.score === 'number' && <span className={styles.detailsScore}>{participant.score}</span>}
                {participant.isWinner && <Trophy size={16} className={styles.detailsWinnerIcon} />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
