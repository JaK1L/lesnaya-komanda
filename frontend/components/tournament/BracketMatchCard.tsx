'use client'

import type { DragEvent, MouseEvent } from 'react'
import { Clock3, Radio, Trophy } from 'lucide-react'
import styles from './TournamentBracket.module.css'
import type { BracketMatchData, BracketParticipant } from './types'

interface Props {
  match: BracketMatchData
  onOpenDetails?: (match: BracketMatchData) => void
  adminMode?: boolean
  onSelectWinner?: (match: any, winner: string) => void
  onDropPlayer?: (match: any, slot: 1 | 2, player: string) => void
}

function formatTime(startTime?: string | null) {
  if (!startTime) return 'Дата уточняется'
  const date = new Date(startTime)
  if (Number.isNaN(date.getTime())) return startTime
  return date.toLocaleString('ru-RU', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function getStatusLabel(status: BracketMatchData['status']) {
  switch (status) {
    case 'live':
      return 'LIVE'
    case 'finished':
      return 'Завершен'
    case 'cancelled':
      return 'Отменен'
    case 'bye':
      return 'Автопроход'
    case 'pending':
      return 'Ожидание'
    default:
      return 'Скоро'
  }
}

function getDisplayName(participant: BracketParticipant) {
  if (participant.isBye) return 'BYE'
  if (participant.isTBD) return 'TBD'
  return participant.name || 'TBD'
}

function renderSeed(participant: BracketParticipant) {
  const display = getDisplayName(participant)
  const seed = display.trim().charAt(0).toUpperCase()
  return seed || '?'
}

export default function BracketMatchCard({
  match,
  onOpenDetails,
  adminMode,
  onSelectWinner,
  onDropPlayer,
}: Props) {
  const handleSlotClick = (event: MouseEvent, participant: BracketParticipant) => {
    if (!adminMode || !onSelectWinner || !participant.name || participant.isTBD || participant.isBye) return
    event.stopPropagation()
    onSelectWinner(match.raw ?? match, participant.name)
  }

  const handleDrop = (slot: 1 | 2) => (event: DragEvent<HTMLDivElement>) => {
    if (!adminMode || !onDropPlayer) return
    event.preventDefault()
    event.stopPropagation()
    const player = event.dataTransfer.getData('player')
    if (player) onDropPlayer(match.raw ?? match, slot, player)
  }

  return (
    <article
      className={[
        styles.matchCard,
        match.status === 'live' ? styles.matchCardLive : '',
        match.status === 'finished' ? styles.matchCardFinished : '',
        match.status === 'cancelled' ? styles.matchCardCancelled : '',
        match.status === 'bye' ? styles.matchCardBye : '',
      ].filter(Boolean).join(' ')}
      onClick={() => onOpenDetails?.(match)}
      role={onOpenDetails ? 'button' : undefined}
      tabIndex={onOpenDetails ? 0 : undefined}
    >
      <div className={styles.matchHeader}>
        <div className={styles.matchStatusWrap}>
          <span className={[
            styles.matchStatus,
            match.status === 'live' ? styles.matchStatusLive : '',
          ].filter(Boolean).join(' ')}>
            {match.status === 'live' && <span className={styles.liveDot} />}
            {getStatusLabel(match.status)}
          </span>
        </div>
        <span className={styles.matchFormat}>{match.matchFormat ?? 'BO1'}</span>
      </div>

      <div className={styles.matchParticipants}>
        {match.participants.map((participant, index) => {
          const isEmpty = participant.isTBD || participant.isBye
          return (
            <div
              key={`${match.id}-${index}`}
              className={[
                styles.participantRow,
                participant.isWinner ? styles.participantWinner : '',
                isEmpty ? styles.participantMuted : '',
                adminMode && participant.name && !isEmpty ? styles.participantSelectable : '',
              ].filter(Boolean).join(' ')}
              onClick={event => handleSlotClick(event, participant)}
              onDragOver={adminMode ? event => event.preventDefault() : undefined}
              onDrop={adminMode ? handleDrop(index === 0 ? 1 : 2) : undefined}
              title={getDisplayName(participant)}
            >
              <div className={styles.participantMain}>
                <span className={styles.participantAvatar}>{renderSeed(participant)}</span>
                <span className={styles.participantName}>{getDisplayName(participant)}</span>
              </div>
              <div className={styles.participantRight}>
                {typeof participant.score === 'number' && <span className={styles.participantScore}>{participant.score}</span>}
                {participant.isWinner && <Trophy size={14} className={styles.participantTrophy} />}
              </div>
            </div>
          )
        })}
      </div>

      <div className={styles.matchFooter}>
        <span className={styles.matchMetaItem}>
          <Clock3 size={12} />
          {formatTime(match.startTime)}
        </span>
        <span className={styles.matchMetaItem}>
          <Radio size={12} />
          Матч {match.position}
        </span>
      </div>
    </article>
  )
}
