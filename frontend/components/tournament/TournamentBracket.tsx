'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, ChevronRight, Loader2, Network, Search, Trophy, ZoomIn, ZoomOut } from 'lucide-react'
import BracketMatchCard from './BracketMatchCard'
import BracketMatchDetails from './BracketMatchDetails'
import styles from './TournamentBracket.module.css'
import type { BracketMatchData, BracketRoundData, BracketSectionData, TournamentBracketFormat } from './types'

interface Props {
  title?: string
  format?: TournamentBracketFormat
  sections: BracketSectionData[]
  loading?: boolean
  error?: string | null
  emptyMessage?: string
  sectionMode?: 'tabs' | 'stacked'
  adminMode?: boolean
  onSelectWinner?: (match: any, winner: string) => void
  onDropPlayer?: (match: any, slot: 1 | 2, player: string) => void
}

const CARD_WIDTH = 280
const CARD_HEIGHT = 140
const ROW_GAP = 28
const COLUMN_GAP = 92
const CONNECTOR_BEND = 34
const CHAMPION_WIDTH = 220

function getFormatLabel(format?: TournamentBracketFormat) {
  if (format === 'double-elimination') return 'Double Elimination'
  return 'Single Elimination'
}

function getDefaultRoundTitle(roundIndex: number, totalRounds: number) {
  const roundNumber = roundIndex + 1
  if (roundNumber === totalRounds) return totalRounds > 1 ? 'Финал' : 'Матч'
  if (roundNumber === totalRounds - 1 && totalRounds > 2) return 'Полуфинал'
  return `Раунд ${roundNumber}`
}

function normalizeRound(round: BracketRoundData, roundIndex: number, totalRounds: number): BracketRoundData {
  return {
    ...round,
    title: round.title || getDefaultRoundTitle(roundIndex, totalRounds),
  }
}

function getMatchTop(roundIndex: number, matchIndex: number) {
  const unit = CARD_HEIGHT + ROW_GAP
  const step = Math.pow(2, roundIndex)
  const baseOffset = ((step - 1) * unit) / 2
  return baseOffset + matchIndex * step * unit
}

function getBoardHeight(rounds: BracketRoundData[]) {
  const firstRoundMatches = rounds[0]?.matches.length ?? 0
  if (firstRoundMatches <= 1) return CARD_HEIGHT
  const unit = CARD_HEIGHT + ROW_GAP
  return (firstRoundMatches - 1) * unit + CARD_HEIGHT
}

function getChampion(section: BracketSectionData) {
  const lastRound = section.rounds[section.rounds.length - 1]
  const finalMatch = lastRound?.matches[0]
  return finalMatch?.winnerName ?? finalMatch?.participants.find(participant => participant.isWinner)?.name ?? null
}

function createConnectorPaths(rounds: BracketRoundData[]) {
  const paths: { id: string; d: string }[] = []

  for (let roundIndex = 0; roundIndex < rounds.length - 1; roundIndex += 1) {
    const currentRound = rounds[roundIndex]
    const nextRound = rounds[roundIndex + 1]
    const startX = roundIndex * (CARD_WIDTH + COLUMN_GAP) + CARD_WIDTH
    const endX = (roundIndex + 1) * (CARD_WIDTH + COLUMN_GAP)

    nextRound.matches.forEach((nextMatch, nextMatchIndex) => {
      const targetY = getMatchTop(roundIndex + 1, nextMatchIndex) + CARD_HEIGHT / 2
      const previousMatches = [currentRound.matches[nextMatchIndex * 2], currentRound.matches[nextMatchIndex * 2 + 1]].filter(Boolean)

      previousMatches.forEach((previousMatch, sourceIndex) => {
        const sourceMatchIndex = nextMatchIndex * 2 + sourceIndex
        const sourceY = getMatchTop(roundIndex, sourceMatchIndex) + CARD_HEIGHT / 2
        const bendX = startX + CONNECTOR_BEND
        const d = `M ${startX} ${sourceY} H ${bendX} V ${targetY} H ${endX}`
        paths.push({ id: `${previousMatch.id}-${nextMatch.id}`, d })
      })
    })
  }

  return paths
}

function BracketBoard({
  section,
  adminMode,
  onSelectWinner,
  onDropPlayer,
}: {
  section: BracketSectionData
  adminMode?: boolean
  onSelectWinner?: (match: any, winner: string) => void
  onDropPlayer?: (match: any, slot: 1 | 2, player: string) => void
}) {
  const [selectedMatch, setSelectedMatch] = useState<BracketMatchData | null>(null)
  const [zoom, setZoom] = useState(1)
  const scrollRef = useRef<HTMLDivElement | null>(null)
  const rounds = section.rounds.map((round, index) => normalizeRound(round, index, section.rounds.length))
  const boardHeight = getBoardHeight(rounds)
  const boardWidth = rounds.length * CARD_WIDTH + Math.max(0, rounds.length - 1) * COLUMN_GAP
  const connectors = createConnectorPaths(rounds)
  const champion = getChampion(section)
  const canvasWidth = boardWidth + (champion ? CHAMPION_WIDTH + 40 : 0)
  const canvasHeight = Math.max(boardHeight, champion ? CARD_HEIGHT : 0)

  const fitBoard = useCallback(() => {
    if (!scrollRef.current) return
    const viewportWidth = scrollRef.current.clientWidth - 24
    const viewportHeight = scrollRef.current.clientHeight - 24
    if (viewportWidth <= 0 || viewportHeight <= 0) return
    const widthScale = viewportWidth / canvasWidth
    const heightScale = viewportHeight / canvasHeight
    const nextZoom = Math.min(1, Math.max(0.6, Math.min(widthScale, heightScale)))
    setZoom(Number(nextZoom.toFixed(2)))
  }, [canvasHeight, canvasWidth])

  useEffect(() => {
    fitBoard()
  }, [fitBoard])

  useEffect(() => {
    const node = scrollRef.current
    if (!node || typeof ResizeObserver === 'undefined') return
    const observer = new ResizeObserver(() => fitBoard())
    observer.observe(node)
    return () => observer.disconnect()
  }, [fitBoard])

  const zoomLabel = useMemo(() => `${Math.round(zoom * 100)}%`, [zoom])

  return (
    <>
      <div className={styles.boardChrome}>
        <div className={styles.boardToolbar}>
          <div className={styles.boardToolbarLabel}>
            <Search size={14} />
            Вид сетки
          </div>
          <div className={styles.boardToolbarActions}>
            <button type="button" className={styles.zoomButton} onClick={() => setZoom(current => Math.max(0.6, Number((current - 0.1).toFixed(2))))} aria-label="Уменьшить">
              <ZoomOut size={14} />
            </button>
            <span className={styles.zoomValue}>{zoomLabel}</span>
            <button type="button" className={styles.zoomButton} onClick={() => setZoom(current => Math.min(1.2, Number((current + 0.1).toFixed(2))))} aria-label="Увеличить">
              <ZoomIn size={14} />
            </button>
            <button type="button" className={styles.fitButton} onClick={fitBoard}>
              Вписать
            </button>
          </div>
        </div>

        <div ref={scrollRef} className={styles.boardScroll}>
          <div className={styles.boardViewport} style={{ width: canvasWidth * zoom, minHeight: canvasHeight * zoom }}>
            <div className={styles.boardScale} style={{ width: canvasWidth, minHeight: canvasHeight, transform: `scale(${zoom})` }}>
              <div className={styles.boardShell} style={{ width: canvasWidth, minHeight: canvasHeight }}>
          <svg className={styles.connectorLayer} width={boardWidth} height={canvasHeight} aria-hidden="true">
            {connectors.map(path => (
              <path key={path.id} d={path.d} className={styles.connectorPath} />
            ))}
          </svg>

          {rounds.map((round, roundIndex) => (
            <div
              key={round.id}
              className={styles.roundColumn}
              style={{ left: roundIndex * (CARD_WIDTH + COLUMN_GAP), width: CARD_WIDTH }}
            >
              <div className={styles.roundTitle}>{round.title}</div>
              {round.matches.map((match, matchIndex) => (
                <div
                  key={match.id}
                  className={styles.matchNode}
                  style={{ top: getMatchTop(roundIndex, matchIndex), width: CARD_WIDTH }}
                >
                  <BracketMatchCard
                    match={match}
                    onOpenDetails={setSelectedMatch}
                    {...(adminMode ? { adminMode: true } : {})}
                    {...(onSelectWinner ? { onSelectWinner } : {})}
                    {...(onDropPlayer ? { onDropPlayer } : {})}
                  />
                </div>
              ))}
            </div>
          ))}

          {champion && (
            <div className={styles.championWrap} style={{ left: boardWidth + 24 }}>
              <div className={styles.roundTitle}>Победитель</div>
              <div className={styles.championCard}>
                <Trophy size={18} className={styles.championIcon} />
                <span>{champion}</span>
              </div>
            </div>
          )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BracketMatchDetails match={selectedMatch} onClose={() => setSelectedMatch(null)} />
    </>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className={styles.stateBox}>
      <Network size={18} />
      <div>
        <div className={styles.stateTitle}>Сетка пока недоступна</div>
        <div className={styles.stateText}>{message}</div>
      </div>
    </div>
  )
}

export default function TournamentBracket({
  title,
  format = 'single-elimination',
  sections,
  loading,
  error,
  emptyMessage = 'Организаторы еще не подготовили сетку для этого турнира.',
  sectionMode = 'tabs',
  adminMode,
  onSelectWinner,
  onDropPlayer,
}: Props) {
  const availableSections = sections.filter(section => section.rounds.length > 0 && section.rounds.some(round => round.matches.length > 0))
  const [activeSectionId, setActiveSectionId] = useState(availableSections[0]?.id ?? '')

  useEffect(() => {
    if (!availableSections.length) {
      setActiveSectionId('')
      return
    }
    if (!availableSections.some(section => section.id === activeSectionId)) {
      setActiveSectionId(availableSections[0].id)
    }
  }, [activeSectionId, availableSections])

  const activeSection = availableSections.find(section => section.id === activeSectionId) ?? availableSections[0]

  return (
    <section className={styles.bracketModule}>
      <div className={styles.moduleHeader}>
        <div>
          <p className={styles.moduleEyebrow}>Турнирная сетка</p>
          <div className={styles.moduleMeta}>
            {title ? <span className={[styles.moduleMetaChip, styles.moduleMetaPrimary].join(' ')}>{title}</span> : null}
            <span className={styles.moduleMetaChip}>{getFormatLabel(format)}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className={styles.stateBox}>
          <Loader2 size={18} className={styles.spinner} />
          <div>
            <div className={styles.stateTitle}>Загружаем сетку</div>
            <div className={styles.stateText}>Подготавливаем раунды, матчи и статусы.</div>
          </div>
        </div>
      ) : error ? (
        <div className={styles.stateBox}>
          <AlertCircle size={18} />
          <div>
            <div className={styles.stateTitle}>Не удалось загрузить сетку</div>
            <div className={styles.stateText}>{error}</div>
          </div>
        </div>
      ) : !availableSections.length ? (
        <EmptyState message={emptyMessage} />
      ) : (
        <>
          {availableSections.length > 1 && sectionMode === 'tabs' ? (
            <div className={styles.sectionTabs}>
              {availableSections.map(section => (
                <button
                  key={section.id}
                  type="button"
                  className={[styles.sectionTab, section.id === activeSection?.id ? styles.sectionTabActive : ''].filter(Boolean).join(' ')}
                  onClick={() => setActiveSectionId(section.id)}
                >
                  {section.title}
                  <ChevronRight size={14} />
                </button>
              ))}
            </div>
          ) : null}

          <div className={styles.sectionStack}>
            {sectionMode === 'stacked'
              ? availableSections.map(section => (
                  <div key={section.id} className={styles.sectionCard}>
                    {availableSections.length > 1 && <div className={styles.sectionHeading}>{section.title}</div>}
                    <BracketBoard
                      section={section}
                      {...(adminMode ? { adminMode: true } : {})}
                      {...(onSelectWinner ? { onSelectWinner } : {})}
                      {...(onDropPlayer ? { onDropPlayer } : {})}
                    />
                  </div>
                ))
              : activeSection && (
                  <div className={styles.sectionCard}>
                    {availableSections.length > 1 && <div className={styles.sectionHeading}>{activeSection.title}</div>}
                    <BracketBoard
                      section={activeSection}
                      {...(adminMode ? { adminMode: true } : {})}
                      {...(onSelectWinner ? { onSelectWinner } : {})}
                      {...(onDropPlayer ? { onDropPlayer } : {})}
                    />
                  </div>
                )}
          </div>
        </>
      )}
    </section>
  )
}
