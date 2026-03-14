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

const CARD_W = 168   // match card width
const CARD_H = 68    // match card height (2 slots × 32 + 4 divider)
const GAP_R1 = 16    // gap between round-1 cards
const CONN_W = 32    // horizontal connector width per side

function getUnit(round: number) {
  return (CARD_H + GAP_R1) * Math.pow(2, round - 1)
}

function getRounds(matches: BracketMatch[], section: string): BracketMatch[][] {
  const filtered = matches.filter(m => m.section === section && !m.is_bye)
  if (!filtered.length) return []
  const max = Math.max(...filtered.map(m => m.round))
  const rounds: BracketMatch[][] = []
  for (let r = 1; r <= max; r++) {
    rounds.push(filtered.filter(m => m.round === r).sort((a, b) => a.match_index - b.match_index))
  }
  return rounds
}

function MatchCard({
  match, adminMode, onSelectWinner, onDropPlayer,
}: {
  match: BracketMatch
  adminMode?: boolean
  onSelectWinner?: (m: BracketMatch, w: string) => void
  onDropPlayer?: (m: BracketMatch, slot: 1 | 2, player: string) => void
}) {
  const p1Won = !!match.player1_name && match.winner_name === match.player1_name
  const p2Won = !!match.player2_name && match.winner_name === match.player2_name
  const completed = match.status === 'completed'
  const canClick = adminMode && !completed

  const handleDrop = (slot: 1 | 2) => (e: React.DragEvent) => {
    e.preventDefault()
    const player = e.dataTransfer.getData('player')
    if (player && onDropPlayer) onDropPlayer(match, slot, player)
  }

  const slotCls = (won: boolean, isLoser: boolean, name: string | null) =>
    [styles.slot, won ? styles.winner : '', (isLoser && completed) ? styles.loser : '', !name ? styles.empty : ''].filter(Boolean).join(' ')

  return (
    <div className={styles.matchCard}>
      <div
        className={slotCls(p1Won, p2Won, match.player1_name)}
        onDragOver={adminMode ? e => e.preventDefault() : undefined}
        onDrop={adminMode ? handleDrop(1) : undefined}
        onClick={canClick && match.player1_name ? () => onSelectWinner?.(match, match.player1_name!) : undefined}
        style={canClick && match.player1_name ? { cursor: 'pointer' } : {}}
        title={canClick && match.player1_name ? 'Нажми для выбора победителя' : undefined}
      >
        <span className={styles.slotName}>{match.player1_name || 'TBD'}</span>
        {match.score1 !== null && <span className={styles.slotScore}>{match.score1}</span>}
      </div>
      <div className={styles.divider} />
      <div
        className={slotCls(p2Won, p1Won, match.player2_name)}
        onDragOver={adminMode ? e => e.preventDefault() : undefined}
        onDrop={adminMode ? handleDrop(2) : undefined}
        onClick={canClick && match.player2_name ? () => onSelectWinner?.(match, match.player2_name!) : undefined}
        style={canClick && match.player2_name ? { cursor: 'pointer' } : {}}
        title={canClick && match.player2_name ? 'Нажми для выбора победителя' : undefined}
      >
        <span className={styles.slotName}>{match.player2_name || 'TBD'}</span>
        {match.score2 !== null && <span className={styles.slotScore}>{match.score2}</span>}
      </div>
    </div>
  )
}

// SVG connectors drawn between two adjacent columns
function ConnectorSvg({ fromCount, toCount, fromUnit, toUnit }: {
  fromCount: number
  toCount: number
  fromUnit: number
  toUnit: number
}) {
  const svgH = fromUnit * fromCount
  const stroke = '#3a4452'
  const lines: React.ReactNode[] = []

  for (let i = 0; i < toCount; i++) {
    // center-y of the output (next round) match
    const outCY = toUnit * i + toUnit / 2

    // two input matches feeding this output
    const topIdx = i * 2
    const botIdx = i * 2 + 1
    const topCY = fromUnit * topIdx + fromUnit / 2
    const botCY = fromUnit * botIdx + fromUnit / 2
    const midY = (topCY + botCY) / 2

    // from top match → right, down to mid, across to output
    lines.push(
      <polyline
        key={`t${i}`}
        points={`0,${topCY} ${CONN_W},${topCY} ${CONN_W},${midY}`}
        fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    )
    // from bot match → right, up to mid
    lines.push(
      <polyline
        key={`b${i}`}
        points={`0,${botCY} ${CONN_W},${botCY} ${CONN_W},${midY}`}
        fill="none" stroke={stroke} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
    )
    // vertical cap dot at midY
    lines.push(
      <line key={`v${i}`} x1={CONN_W} y1={midY} x2={CONN_W * 2} y2={midY}
        stroke={stroke} strokeWidth="1.5" strokeLinecap="round" />
    )
  }

  return (
    <svg
      width={CONN_W * 2}
      height={svgH}
      style={{ flexShrink: 0, display: 'block' }}
      overflow="visible"
    >
      {lines}
    </svg>
  )
}

// Connector from final match to champion card
function FinalConnector({ unit }: { unit: number }) {
  const cy = unit / 2
  return (
    <svg width={CONN_W} height={unit} style={{ flexShrink: 0, display: 'block' }} overflow="visible">
      <line x1={0} y1={cy} x2={CONN_W} y2={cy}
        stroke="#3a4452" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export default function BracketView({ matches, section = 'winners', onSelectWinner, onDropPlayer, adminMode }: Props) {
  const rounds = getRounds(matches, section)
  if (!rounds.length) return <div className={styles.empty}>Сетка не сформирована</div>

  const finalMatch = rounds[rounds.length - 1]?.[0]
  const champion = finalMatch?.winner_name ?? null
  const lastUnit = getUnit(rounds.length)

  return (
    <div className={styles.bracket}>
      {rounds.map((roundMatches, ri) => {
        const r = ri + 1
        const unit = getUnit(r)
        const isLastRound = ri === rounds.length - 1
        const nextUnit = getUnit(r + 1)
        const totalRounds = rounds.length

        const label =
          isLastRound && totalRounds > 1 ? 'Финал'
          : r === totalRounds - 1 && totalRounds > 2 ? 'Полуфинал'
          : `Раунд ${r}`

        return (
          <div key={r} style={{ display: 'flex', alignItems: 'flex-start' }}>
            {/* Column */}
            <div className={styles.roundCol}>
              <div className={styles.roundLabel}>{label}</div>
              <div className={styles.matchesCol}>
                {roundMatches.map(m => (
                  <div key={m.id} style={{ height: unit, display: 'flex', alignItems: 'center' }}>
                    <MatchCard
                      match={m}
                      {...(adminMode ? { adminMode: true } : {})}
                      {...(onSelectWinner ? { onSelectWinner } : {})}
                      {...(onDropPlayer ? { onDropPlayer } : {})}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Connector to next round OR to champion */}
            {isLastRound ? (
              <div style={{ marginTop: 28 }}>
                <FinalConnector unit={lastUnit} />
              </div>
            ) : (
              <div style={{ marginTop: 28 }}>
                <ConnectorSvg
                  fromCount={roundMatches.length}
                  toCount={Math.ceil(roundMatches.length / 2)}
                  fromUnit={unit}
                  toUnit={nextUnit}
                />
              </div>
            )}
          </div>
        )
      })}

      {/* Champion */}
      <div className={styles.roundCol}>
        <div className={styles.roundLabel}>Победитель</div>
        <div style={{ height: lastUnit, display: 'flex', alignItems: 'center' }}>
          <div className={styles.championCard}>
            <span className={styles.championName}>{champion ?? 'TBD'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
