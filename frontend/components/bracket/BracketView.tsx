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

const MATCH_H = 64   // px per match card
const BASE_GAP = 12  // px gap between round-1 matches

function getUnit(round: number) {
  return (MATCH_H + BASE_GAP) * Math.pow(2, round - 1)
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

export default function BracketView({ matches, section = 'winners', onSelectWinner, onDropPlayer, adminMode }: Props) {
  const rounds = getRounds(matches, section)
  if (!rounds.length) return <div className={styles.empty}>Сетка не сформирована</div>

  const finalMatch = rounds[rounds.length - 1]?.[0]
  const champion = finalMatch?.winner_name ?? null
  const finalUnit = getUnit(rounds.length)

  return (
    <div className={styles.bracket}>
      {rounds.map((roundMatches, ri) => {
        const r = ri + 1
        const unit = getUnit(r)
        const isLastRound = ri === rounds.length - 1
        const totalRounds = rounds.length

        const roundLabel =
          isLastRound && totalRounds > 1 ? 'Финал'
          : r === totalRounds - 1 && totalRounds > 2 ? 'Полуфинал'
          : `Раунд ${r}`

        return (
          <div key={r} className={styles.roundCol}>
            <div className={styles.roundLabel}>{roundLabel}</div>
            <div className={styles.matchesCol}>
              {roundMatches.map((m, mi) => (
                <div key={m.id} className={styles.matchCell} style={{ height: unit }}>
                  <div className={styles.matchInner}>
                    {r > 1 && (
                      <div className={styles.leftConn}>
                        <div className={styles.leftConnHoriz} />
                        <div className={styles.leftConnVert} style={{
                          top: mi % 2 === 0 ? '50%' : 0,
                          bottom: mi % 2 === 0 ? 0 : '50%',
                        }} />
                      </div>
                    )}
                    <MatchCard
                      match={m}
                      {...(adminMode ? { adminMode: true } : {})}
                      {...(onSelectWinner ? { onSelectWinner } : {})}
                      {...(onDropPlayer ? { onDropPlayer } : {})}
                    />
                    {!isLastRound && (
                      <div className={styles.rightConn}>
                        <div className={styles.rightConnHoriz} />
                        <div className={styles.rightConnVert} style={{
                          top: mi % 2 === 0 ? '50%' : 0,
                          bottom: mi % 2 === 0 ? 0 : '50%',
                        }} />
                      </div>
                    )}
                    {/* Winner connector (only for final match) */}
                    {isLastRound && (
                      <div className={styles.rightConn}>
                        <div className={styles.rightConnHoriz} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {/* Champion column */}
      <div className={styles.roundCol}>
        <div className={styles.roundLabel}>Победитель</div>
        <div className={styles.matchesCol}>
          <div className={styles.matchCell} style={{ height: finalUnit }}>
            <div className={styles.championCard}>
              <span className={styles.championName}>{champion ?? 'TBD'}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
