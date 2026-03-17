'use client'

import styles from './BracketView.module.css'

export interface BracketMatch {
  id: number
  section: string
  round: number
  match_index: number
  player1_name: string | null
  player2_name: string | null
  winner_name: string | null
  score1: number | null
  score2: number | null
  is_bye: boolean
  status: string
}

interface Props {
  matches: BracketMatch[]
  section?: string
  onSelectWinner?: (match: BracketMatch, winner: string) => void
  onDropPlayer?: (match: BracketMatch, slot: 1 | 2, player: string) => void
  adminMode?: boolean
}

const CARD_H = 90
const GAP_R1 = 20
const CONN_W = 36

function getUnit(round: number) {
  return (CARD_H + GAP_R1) * Math.pow(2, round - 1)
}

function getRounds(matches: BracketMatch[], section: string): BracketMatch[][] {
  const filtered = matches.filter(match => match.section === section)
  if (!filtered.length) return []

  const maxRound = Math.max(...filtered.map(match => match.round))
  const rounds: BracketMatch[][] = []

  for (let round = 1; round <= maxRound; round += 1) {
    rounds.push(
      filtered
        .filter(match => match.round === round)
        .sort((a, b) => a.match_index - b.match_index)
    )
  }

  return rounds
}

function getDisplayName(match: BracketMatch, slot: 1 | 2) {
  const playerName = slot === 1 ? match.player1_name : match.player2_name
  if (playerName) return playerName
  if (match.is_bye) return 'BYE'
  return 'TBD'
}

function getRoundLabel(round: number, totalRounds: number, isLastRound: boolean) {
  if (isLastRound && totalRounds > 1) return 'Финал'
  if (round === totalRounds - 1 && totalRounds > 2) return 'Полуфинал'
  return `Раунд ${round}`
}

function MatchCard({
  match,
  adminMode,
  onSelectWinner,
  onDropPlayer,
}: {
  match: BracketMatch
  adminMode?: boolean
  onSelectWinner?: (match: BracketMatch, winner: string) => void
  onDropPlayer?: (match: BracketMatch, slot: 1 | 2, player: string) => void
}) {
  const player1Won = !!match.player1_name && match.winner_name === match.player1_name
  const player2Won = !!match.player2_name && match.winner_name === match.player2_name
  const completed = match.status === 'completed'
  const canClick = adminMode && !completed
  const showAutoAdvance = match.is_bye && !!match.winner_name
  const player1Display = getDisplayName(match, 1)
  const player2Display = getDisplayName(match, 2)

  const handleDrop = (slot: 1 | 2) => (event: React.DragEvent) => {
    event.preventDefault()
    const player = event.dataTransfer.getData('player')
    if (player && onDropPlayer) onDropPlayer(match, slot, player)
  }

  const getSlotClassName = (won: boolean, isLoser: boolean, hasPlayer: boolean) =>
    [
      styles.slot,
      won ? styles.winner : '',
      isLoser && completed ? styles.loser : '',
      !hasPlayer ? styles.empty : '',
    ]
      .filter(Boolean)
      .join(' ')

  return (
    <div className={[styles.matchCard, showAutoAdvance ? styles.autoAdvanceCard : ''].filter(Boolean).join(' ')}>
      <div className={styles.cardMeta}>
        {showAutoAdvance ? <span className={styles.matchBadge}>Автопроход</span> : <span className={styles.matchMetaSpacer} />}
      </div>
      <div
        className={getSlotClassName(player1Won, player2Won, !!match.player1_name)}
        onDragOver={adminMode ? event => event.preventDefault() : undefined}
        onDrop={adminMode ? handleDrop(1) : undefined}
        onClick={canClick && match.player1_name ? () => onSelectWinner?.(match, match.player1_name as string) : undefined}
        style={canClick && match.player1_name ? { cursor: 'pointer' } : undefined}
        title={canClick && match.player1_name ? 'Нажми, чтобы выбрать победителя' : undefined}
      >
        <span className={styles.slotName}>{player1Display}</span>
        {match.score1 !== null && <span className={styles.slotScore}>{match.score1}</span>}
      </div>
      <div className={styles.divider} />
      <div
        className={getSlotClassName(player2Won, player1Won, !!match.player2_name)}
        onDragOver={adminMode ? event => event.preventDefault() : undefined}
        onDrop={adminMode ? handleDrop(2) : undefined}
        onClick={canClick && match.player2_name ? () => onSelectWinner?.(match, match.player2_name as string) : undefined}
        style={canClick && match.player2_name ? { cursor: 'pointer' } : undefined}
        title={canClick && match.player2_name ? 'Нажми, чтобы выбрать победителя' : undefined}
      >
        <span className={styles.slotName}>{player2Display}</span>
        {match.score2 !== null && <span className={styles.slotScore}>{match.score2}</span>}
      </div>
    </div>
  )
}

function ConnectorSvg({
  fromCount,
  toCount,
  fromUnit,
}: {
  fromCount: number
  toCount: number
  fromUnit: number
}) {
  const svgHeight = fromUnit * fromCount
  const stroke = '#364152'
  const lines: React.ReactNode[] = []

  for (let index = 0; index < toCount; index += 1) {
    const topIndex = index * 2
    const bottomIndex = index * 2 + 1
    const topCenterY = fromUnit * topIndex + fromUnit / 2
    const bottomCenterY = fromUnit * bottomIndex + fromUnit / 2
    const midY = (topCenterY + bottomCenterY) / 2

    lines.push(
      <polyline
        key={`top-${index}`}
        points={`0,${topCenterY} ${CONN_W},${topCenterY} ${CONN_W},${midY}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
    lines.push(
      <polyline
        key={`bottom-${index}`}
        points={`0,${bottomCenterY} ${CONN_W},${bottomCenterY} ${CONN_W},${midY}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    )
    lines.push(
      <line
        key={`mid-${index}`}
        x1={CONN_W}
        y1={midY}
        x2={CONN_W * 2}
        y2={midY}
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    )
  }

  return (
    <svg className={styles.connector} width={CONN_W * 2} height={svgHeight} overflow="visible">
      {lines}
    </svg>
  )
}

function FinalConnector({ unit }: { unit: number }) {
  const centerY = unit / 2
  return (
    <svg className={styles.connector} width={CONN_W} height={unit} overflow="visible">
      <line x1={0} y1={centerY} x2={CONN_W} y2={centerY} stroke="#364152" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function BracketView({
  matches,
  section = 'winners',
  onSelectWinner,
  onDropPlayer,
  adminMode,
}: Props) {
  const rounds = getRounds(matches, section)
  if (!rounds.length) return <div className={styles.empty}>Сетка не сформирована</div>

  const firstRoundPlayers = rounds[0]?.flatMap(match => [match.player1_name, match.player2_name]).filter(Boolean).length ?? 0
  const isCompactBracket = section === 'winners' && firstRoundPlayers <= 3
  const totalRounds = rounds.length
  const finalMatch = rounds[rounds.length - 1]?.[0]
  const champion = finalMatch?.winner_name ?? null
  const lastUnit = getUnit(rounds.length)
  const showChampion = Boolean(champion)

  return (
    <div className={[styles.bracket, isCompactBracket ? styles.compactBracket : ''].filter(Boolean).join(' ')}>
      {rounds.map((roundMatches, roundIndex) => {
        const round = roundIndex + 1
        const unit = getUnit(round)
        const isLastRound = roundIndex === rounds.length - 1
        const label = getRoundLabel(round, totalRounds, isLastRound)

        return (
          <div key={round} className={styles.roundGroup}>
            <div className={[styles.roundCol, isCompactBracket ? styles.compactRoundCol : ''].filter(Boolean).join(' ')}>
              <div className={styles.roundLabel}>{label}</div>
              <div className={styles.matchesCol}>
                {roundMatches.map(match => (
                  <div key={match.id} className={styles.matchSlot} style={{ height: unit }}>
                    <MatchCard
                      match={match}
                      {...(adminMode ? { adminMode: true } : {})}
                      {...(onSelectWinner ? { onSelectWinner } : {})}
                      {...(onDropPlayer ? { onDropPlayer } : {})}
                    />
                  </div>
                ))}
              </div>
            </div>

            {!isLastRound && (
              <div className={styles.connectorWrap}>
                <ConnectorSvg
                  fromCount={roundMatches.length}
                  toCount={Math.ceil(roundMatches.length / 2)}
                  fromUnit={unit}
                />
              </div>
            )}

            {isLastRound && showChampion && (
              <div className={styles.connectorWrap}>
                <FinalConnector unit={lastUnit} />
              </div>
            )}
          </div>
        )
      })}

      {showChampion && (
        <div className={styles.roundCol}>
          <div className={styles.roundLabel}>Победитель</div>
          <div className={styles.matchSlot} style={{ height: lastUnit }}>
            <div className={styles.championCard}>
              <span className={styles.championName}>{champion}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
