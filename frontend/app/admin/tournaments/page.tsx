'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Pencil, Trash2, Calendar, Crown, Plus, X, Users, Network, Shuffle, Maximize2, Minimize2 } from 'lucide-react'
import BracketView, { BracketMatch } from '../../../components/bracket/BracketView'
import styles from '../news/page.module.css'
import modalStyles from './modal.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

function handleAdminAuthError() {
  if (typeof window === 'undefined') return
  localStorage.removeItem('admin_token')
  window.location.href = '/admin'
}

interface Tournament {
  id: number
  title: string
  description: string | null
  game: string | null
  prize: string | null
  role_reward: string | null
  challonge_url: string | null
  start_date: string | null
  status: 'upcoming' | 'active' | 'completed'
  winner: string | null
  image_url: string | null
  type: '1v1' | '5v5'
  max_participants: number | null
}

const EMPTY: Omit<Tournament, 'id'> = {
  title: '',
  description: '',
  game: '',
  prize: '',
  role_reward: '',
  challonge_url: '',
  start_date: '',
  status: 'upcoming',
  winner: '',
  image_url: '',
  type: '1v1',
  max_participants: null,
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'РЎРєРѕСЂРѕ',
  active: 'РРґС‘С‚',
  completed: 'Р—Р°РІРµСЂС€С‘РЅ',
}

interface Registration {
  id: number
  tournament_type: string
  nickname: string | null
  discord: string | null
  steam: string | null
  team_name: string | null
  players: string[] | null
  contact: string | null
  registered_at: string
}

function RegViewer({ tournamentId, token, onClose }: { tournamentId: number; token: string; onClose: () => void }) {
  const [regs, setRegs] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)

  const loadRegs = () => {
    setLoading(true)
    fetch(`${API_URL}/api/admin/tournaments/${tournamentId}/registrations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (r.status === 401) {
          handleAdminAuthError()
          throw new Error('unauthorized')
        }
        return r.json()
      })
      .then(data => { setRegs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadRegs() }, [tournamentId, token])

  const handleDelete = async (regId: number) => {
    if (!confirm('РЈРґР°Р»РёС‚СЊ Р·Р°СЏРІРєСѓ?')) return
    const response = await fetch(`${API_URL}/api/admin/tournaments/${tournamentId}/registrations/${regId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status === 401) {
      handleAdminAuthError()
      return
    }
    loadRegs()
  }

  return (
    <div className={modalStyles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={modalStyles.modal}>
        <div className={modalStyles.modalHeader}>
          <h2>Р—Р°СЏРІРєРё</h2>
          <button className={modalStyles.close} onClick={onClose} aria-label="Close"><X size={16} /></button>
        </div>
        <div className={modalStyles.body}>
          {loading ? (
            <p style={{ color: '#888' }}>Р—Р°РіСЂСѓР·РєР°...</p>
          ) : regs.length === 0 ? (
            <p style={{ color: '#888' }}>Р—Р°СЏРІРѕРє РїРѕРєР° РЅРµС‚</p>
          ) : regs.map(r => (
            <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #333', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                {r.tournament_type === '1v1' ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>{r.nickname}</span>
                    {r.discord && <span style={{ color: '#888' }}>Discord: {r.discord}</span>}
                    {r.steam && <span style={{ color: '#888' }}>Steam: {r.steam}</span>}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ color: '#fff', fontWeight: 600 }}>РљРѕРјР°РЅРґР°: {r.team_name}</span>
                    {r.players && <span style={{ color: '#aaa' }}>РРіСЂРѕРєРё: {r.players.join(', ')}</span>}
                    {r.contact && <span style={{ color: '#888' }}>РљРѕРЅС‚Р°РєС‚: {r.contact}</span>}
                  </div>
                )}
                <button
                  onClick={() => handleDelete(r.id)}
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
                  title="РЈРґР°Р»РёС‚СЊ Р·Р°СЏРІРєСѓ"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <span style={{ color: '#555', fontSize: 11 }}>
                {new Date(r.registered_at).toLocaleString('ru-RU')}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function BracketManager({ tournamentId, token, onClose }: { tournamentId: number; token: string; onClose: () => void }) {
  const [matches, setMatches] = useState<BracketMatch[]>([])
  const [loading, setLoading] = useState(true)
  const [bracketType, setBracketType] = useState<'single' | 'double'>('single')
  const [generating, setGenerating] = useState(false)
  const [randomizing, setRandomizing] = useState(false)
  const [genError, setGenError] = useState('')
  const [customPlayers, setCustomPlayers] = useState('')  // one per line
  const [registrations, setRegistrations] = useState<string[]>([])
  const [editMatch, setEditMatch] = useState<BracketMatch | null>(null)
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [winner, setWinner] = useState('')
  const [player1Name, setPlayer1Name] = useState('')
  const [player2Name, setPlayer2Name] = useState('')
  const [matchStatus, setMatchStatus] = useState<'pending' | 'upcoming' | 'live' | 'completed' | 'cancelled' | 'bye'>('pending')
  const [matchFormat, setMatchFormat] = useState<'BO1' | 'BO3' | 'BO5'>('BO1')
  const [matchStartTime, setMatchStartTime] = useState('')
  const [matchBye, setMatchBye] = useState(false)
  const [matchSaving, setMatchSaving] = useState(false)
  const [matchResetting, setMatchResetting] = useState(false)
  const [matchError, setMatchError] = useState('')
  const [expanded, setExpanded] = useState(false)

  const loadRegs = () => {
    fetch(`${API_URL}/api/admin/tournaments/${tournamentId}/registrations`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async r => {
        if (r.status === 401) {
          handleAdminAuthError()
          throw new Error('unauthorized')
        }
        return r.json()
      })
      .then((data: Registration[]) => {
        setRegistrations(data.map(r => r.nickname || r.team_name || '').filter(Boolean))
      })
      .catch(() => {})
  }

  const load = () => {
    setLoading(true)
    fetch(`${API_URL}/api/tournaments/${tournamentId}/bracket`, { headers: { Authorization: `Bearer ${token}` } })
      .then(async r => {
        if (r.status === 401) {
          handleAdminAuthError()
          throw new Error('unauthorized')
        }
        return r.json()
      })
      .then(d => {
        const nextMatches = Array.isArray(d) ? d : []
        setMatches(nextMatches)
        if (nextMatches[0]?.bracket_type === 'double') setBracketType('double')
        if (nextMatches[0]?.bracket_type === 'single') setBracketType('single')
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => { load(); loadRegs() }, [tournamentId])

  const generate = async () => {
    if (!confirm(`РЎС„РѕСЂРјРёСЂРѕРІР°С‚СЊ СЃРµС‚РєСѓ (${bracketType === 'single' ? 'Single' : 'Double'} Elimination)? РЎС‚Р°СЂР°СЏ СЃРµС‚РєР° Р±СѓРґРµС‚ СѓРґР°Р»РµРЅР°.`)) return
    setGenerating(true)
    setGenError('')
    const customList = customPlayers.split('\n').map(s => s.trim()).filter(Boolean)
    const body: any = { bracket_type: bracketType }
    if (customList.length > 0) body.custom_players = customList
    try {
      const res = await fetch(`${API_URL}/api/admin/tournaments/${tournamentId}/bracket/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (res.status === 401) {
        handleAdminAuthError()
        return
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setGenError(data.detail || `РћС€РёР±РєР° ${res.status}`)
      } else {
        load()
      }
    } catch {
      setGenError('РћС€РёР±РєР° СЃРµС‚Рё')
    } finally {
      setGenerating(false)
    }
  }

  const reset = async () => {
    if (!confirm('РЈРґР°Р»РёС‚СЊ СЃРµС‚РєСѓ РїРѕР»РЅРѕСЃС‚СЊСЋ?')) return
    const response = await fetch(`${API_URL}/api/admin/tournaments/${tournamentId}/bracket`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    if (response.status === 401) {
      handleAdminAuthError()
      return
    }
    load()
  }

  const randomizeBracket = async () => {
    if (matches.length === 0) {
      setGenError('РЎРЅР°С‡Р°Р»Р° СЃС„РѕСЂРјРёСЂСѓР№С‚Рµ СЃРµС‚РєСѓ, Р° РїРѕС‚РѕРј РёСЃРїРѕР»СЊР·СѓР№С‚Рµ СЂР°РЅРґРѕРј.')
      return
    }

    const sourcePlayers = customPlayers
      .split('\n')
      .map(player => player.trim())
      .filter(Boolean)

    const playersToShuffle = sourcePlayers.length > 0 ? sourcePlayers : registrations

    if (playersToShuffle.length === 0) {
      setGenError('РќРµС‚ Р·Р°СЏРІРѕРє РґР»СЏ СЃР»СѓС‡Р°Р№РЅРѕРіРѕ СЂР°СЃРїСЂРµРґРµР»РµРЅРёСЏ.')
      return
    }

    if (!confirm('РЎР»СѓС‡Р°Р№РЅРѕ РїРµСЂРµСЃРѕР±СЂР°С‚СЊ СЃРµС‚РєСѓ С‚СѓСЂРЅРёСЂР°? РўРµРєСѓС‰Р°СЏ СЃРµС‚РєР° Р±СѓРґРµС‚ РїРµСЂРµСЃРѕР·РґР°РЅР°.')) return

    setRandomizing(true)
    setGenError('')

    const shuffledPlayers = [...playersToShuffle]
    for (let i = shuffledPlayers.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffledPlayers[i], shuffledPlayers[j]] = [shuffledPlayers[j], shuffledPlayers[i]]
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/tournaments/${tournamentId}/bracket/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bracket_type: bracketType,
          custom_players: shuffledPlayers,
        }),
      })
      if (response.status === 401) {
        handleAdminAuthError()
        return
      }

      if (!response.ok) {
        throw new Error('randomize_failed')
      }

      load()
    } catch {
      setGenError('РќРµ СѓРґР°Р»РѕСЃСЊ СЃР»СѓС‡Р°Р№РЅРѕ СЂР°СЃРїСЂРµРґРµР»РёС‚СЊ СѓС‡Р°СЃС‚РЅРёРєРѕРІ.')
    } finally {
      setRandomizing(false)
    }
  }

  const saveMatch = async () => {
    if (!editMatch) return
    setMatchSaving(true)
    setMatchError('')
    const response = await fetch(`${API_URL}/api/admin/bracket/match/${editMatch.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        player1_name: player1Name || null,
        player2_name: player2Name || null,
        winner_name: winner || null,
        score1,
        score2,
        status: matchStatus,
        match_format: matchFormat,
        start_time: matchStartTime || null,
        is_bye: matchBye,
      }),
    })
    if (response.status === 401) {
      handleAdminAuthError()
      return
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setMatchError(payload.detail || `РћС€РёР±РєР° ${response.status}`)
      setMatchSaving(false)
      return
    }
    setEditMatch(null)
    setMatchSaving(false)
    load()
  }

  const resetMatchProgress = async () => {
    if (!editMatch) return
    setMatchResetting(true)
    setMatchError('')
    const response = await fetch(`${API_URL}/api/admin/bracket/match/${editMatch.id}/reset`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status === 401) {
      handleAdminAuthError()
      return
    }
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}))
      setMatchError(payload.detail || `РћС€РёР±РєР° ${response.status}`)
      setMatchResetting(false)
      return
    }
    setEditMatch(null)
    setMatchResetting(false)
    load()
  }

  const handleDropPlayer = async (match: BracketMatch, slot: 1 | 2, player: string) => {
    const response = await fetch(`${API_URL}/api/admin/bracket/match/${match.id}/slot`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ slot, player_name: player }),
    })
    if (response.status === 401) {
      handleAdminAuthError()
      return
    }
    load()
  }

  const handleSelectWinner = (match: BracketMatch, _winner?: string) => {
    setEditMatch(match)
    setPlayer1Name(match.player1_name ?? '')
    setPlayer2Name(match.player2_name ?? '')
    setScore1(match.score1 ?? 0)
    setScore2(match.score2 ?? 0)
    setWinner(match.winner_name ?? _winner ?? '')
    setMatchStatus((match.status as 'pending' | 'upcoming' | 'live' | 'completed' | 'cancelled' | 'bye') || 'pending')
    setMatchFormat(match.match_format || 'BO1')
    setMatchStartTime(match.start_time ? String(match.start_time).slice(0, 16) : '')
    setMatchBye(Boolean(match.is_bye))
    setMatchError('')
  }

  return (
    <div className={modalStyles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={modalStyles.modal} style={{ maxWidth: expanded ? '98vw' : '95vw', width: expanded ? 'min(98vw, 1680px)' : 1200, maxHeight: expanded ? '98vh' : '95vh', height: expanded ? '98vh' : 'auto', display: 'flex', flexDirection: 'column' }}>
        <div className={modalStyles.modalHeader}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Network size={18} /> РЎРµС‚РєР° С‚СѓСЂРЅРёСЂР°</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              className={modalStyles.close}
              onClick={() => setExpanded(current => !current)}
              title={expanded ? 'Collapse bracket' : 'Expand bracket'}
            >
              {expanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
            <button className={modalStyles.close} onClick={onClose}><X size={16} /></button>
          </div>
        </div>

        {/* Controls bar */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #2a2f36', display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <select className={modalStyles.select} value={bracketType} onChange={e => setBracketType(e.target.value as 'single' | 'double')} style={{ width: 'auto' }}>
            <option value="single">Single Elimination</option>
            <option value="double">Double Elimination</option>
          </select>
          <button onClick={generate} disabled={generating} style={{ padding: '6px 14px', background: '#4f9fff', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
            {generating ? 'Р“РµРЅРµСЂР°С†РёСЏ...' : 'РЎС„РѕСЂРјРёСЂРѕРІР°С‚СЊ'}
          </button>
          {matches.length > 0 && (
            <button onClick={reset} style={{ padding: '6px 14px', background: '#c0392b', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
              РЎР±СЂРѕСЃРёС‚СЊ
            </button>
          )}
          {matches.length > 0 && (
            <button
              onClick={randomizeBracket}
              disabled={randomizing}
              style={{ padding: '6px 14px', background: '#8b5cf6', border: 'none', color: '#fff', borderRadius: 8, cursor: randomizing ? 'default' : 'pointer', fontWeight: 600, fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 6, opacity: randomizing ? 0.7 : 1 }}
            >
              <Shuffle size={14} />
              {randomizing ? 'Р Р°РЅРґРѕРј...' : 'Р Р°РЅРґРѕРј'}
            </button>
          )}
          <div style={{ flex: 1, minWidth: 200 }}>
            <textarea
              value={customPlayers}
              onChange={e => setCustomPlayers(e.target.value)}
              placeholder={'РЈС‡Р°СЃС‚РЅРёРєРё РІСЂСѓС‡РЅСѓСЋ (РїРѕ РѕРґРЅРѕРјСѓ РЅР° СЃС‚СЂРѕРєСѓ)'}
              rows={2}
              style={{ width: '100%', background: '#111', border: '1px solid #2a2f36', borderRadius: 8, color: '#fff', padding: '6px 8px', fontSize: 12, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>
          {genError && <p style={{ color: '#e74c3c', fontSize: 13, margin: 0, alignSelf: 'center' }}>{genError}</p>}
        </div>

        {/* Two-panel body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
          {/* Left: participant list */}
          <div style={{ width: expanded ? 220 : 180, flexShrink: 0, borderRight: '1px solid #2a2f36', padding: '12px 10px', overflowY: 'auto', background: '#0f1218' }}>
            <div style={{ fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>РЈС‡Р°СЃС‚РЅРёРєРё</div>
            {registrations.length === 0 && (
              <p style={{ fontSize: 12, color: '#555' }}>РќРµС‚ Р·Р°СЏРІРѕРє</p>
            )}
            {registrations.map((name, i) => (
              <div
                key={i}
                draggable
                onDragStart={e => e.dataTransfer.setData('player', name)}
                style={{ padding: '6px 10px', background: '#1a1e24', border: '1px solid #2a2f36', borderRadius: 8, marginBottom: 6, fontSize: 13, color: '#fff', cursor: 'grab', userSelect: 'none' }}
              >
                {name}
              </div>
            ))}
          </div>

          {/* Right: bracket view */}
          <div style={{ flex: 1, overflowX: 'auto', overflowY: 'auto', padding: expanded ? '20px' : '16px', minHeight: 0 }}>
            {loading && <p style={{ color: '#888' }}>Р—Р°РіСЂСѓР·РєР°...</p>}
            {!loading && matches.length === 0 && (
              <p style={{ color: '#888' }}>РЎРµС‚РєР° РЅРµ СЃС„РѕСЂРјРёСЂРѕРІР°РЅР°. Р’РІРµРґРёС‚Рµ СѓС‡Р°СЃС‚РЅРёРєРѕРІ Рё РЅР°Р¶РјРёС‚Рµ "РЎС„РѕСЂРјРёСЂРѕРІР°С‚СЊ".</p>
            )}
            {!loading && matches.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {['winners', 'losers', 'grand_final'].filter(s => matches.some(m => m.section === s)).map(section => (
                  <div key={section}>
                    <div style={{ fontSize: 11, color: '#4f9fff', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>
                      {{ winners: 'РџРѕР±РµРґРёС‚РµР»Рё', losers: 'РџСЂРѕРёРіСЂР°РІС€РёРµ', grand_final: 'Р“СЂР°РЅРґ-С„РёРЅР°Р»' }[section]}
                    </div>
                    <BracketView
                      matches={matches}
                      section={section}
                      adminMode
                      onSelectWinner={handleSelectWinner}
                      onDropPlayer={handleDropPlayer}
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Edit match modal */}
      {editMatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={() => setEditMatch(null)}>
          <div style={{ background: '#1a1e24', border: '1px solid #333', borderRadius: 16, padding: '1.5rem', width: 440, maxWidth: 'calc(100vw - 32px)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: 15 }}>
              {editMatch.player1_name || 'TBD'} vs {editMatch.player2_name || 'TBD'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <input value={player1Name} onChange={e => setPlayer1Name(e.target.value)} placeholder="Игрок 1" style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff', boxSizing: 'border-box' }} />
              <input value={player2Name} onChange={e => setPlayer2Name(e.target.value)} placeholder="Игрок 2" style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff', boxSizing: 'border-box' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <select value={matchStatus} onChange={e => setMatchStatus(e.target.value as typeof matchStatus)} style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff' }}>
                <option value="pending">Ожидание</option>
                <option value="upcoming">Скоро</option>
                <option value="live">LIVE</option>
                <option value="completed">Завершён</option>
                <option value="cancelled">Отменён</option>
                <option value="bye">Автопроход</option>
              </select>
              <select value={matchFormat} onChange={e => setMatchFormat(e.target.value as typeof matchFormat)} style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff' }}>
                <option value="BO1">BO1</option>
                <option value="BO3">BO3</option>
                <option value="BO5">BO5</option>
              </select>
            </div>
            <input type="datetime-local" value={matchStartTime} onChange={e => setMatchStartTime(e.target.value)} style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff', marginBottom: 12, boxSizing: 'border-box' }} />
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input type="number" min={0} value={score1} onChange={e => setScore1(Number(e.target.value))}
                style={{ flex: 1, padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff', textAlign: 'center' }} />
              <span style={{ color: '#555', alignSelf: 'center' }}>:</span>
              <input type="number" min={0} value={score2} onChange={e => setScore2(Number(e.target.value))}
                style={{ flex: 1, padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff', textAlign: 'center' }} />
            </div>
            <select value={winner} onChange={e => setWinner(e.target.value)}
              style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff', marginBottom: 12 }}>
              <option value="">— выбрать победителя —</option>
              {player1Name && <option value={player1Name}>{player1Name}</option>}
              {player2Name && <option value={player2Name}>{player2Name}</option>}
            </select>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#bbb', fontSize: 12, marginBottom: 12 }}>
              <input type="checkbox" checked={matchBye} onChange={e => setMatchBye(e.target.checked)} />
              Автопроход / BYE матч
            </label>
            {matchError && <div style={{ color: '#ff7b7b', fontSize: 12, marginBottom: 12 }}>{matchError}</div>}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
              <button onClick={resetMatchProgress} disabled={matchResetting} style={{ padding: '8px', background: '#7f1d1d', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{matchResetting ? 'Сброс...' : 'Сбросить'}</button>
              <button onClick={saveMatch} disabled={matchSaving} style={{ padding: '8px', background: '#4f9fff', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>{matchSaving ? 'Сохранение...' : 'Сохранить'}</button>
              <button onClick={() => setEditMatch(null)} style={{ padding: '8px', background: '#333', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>Отмена</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function AdminTournamentsPage() {
  const router = useRouter()
  const [items, setItems] = useState<Tournament[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Tournament | null>(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [regViewId, setRegViewId] = useState<number | null>(null)
  const [bracketId, setBracketId] = useState<number | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) { router.push('/admin'); return }
    fetch_(token)
  }, [router])

  const fetch_ = async (token?: string) => {
    const t = token || localStorage.getItem('admin_token')
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/api/admin/tournaments`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      if (res.status === 401) {
        handleAdminAuthError()
        return
      }
      setItems(await res.json())
    } finally {
      setLoading(false)
    }
  }

  const openCreate = () => {
    setEditing(null)
    setForm(EMPTY)
    setError('')
    setShowModal(true)
  }

  const openEdit = (item: Tournament) => {
    setEditing(item)
    setForm({
      title: item.title,
      description: item.description ?? '',
      game: item.game ?? '',
      prize: item.prize ?? '',
      role_reward: item.role_reward ?? '',
      challonge_url: item.challonge_url ?? '',
      start_date: item.start_date ? item.start_date.slice(0, 16) : '',
      status: item.status,
      winner: item.winner ?? '',
      image_url: item.image_url ?? '',
      type: item.type ?? '1v1',
      max_participants: item.max_participants ?? null,
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.title.trim()) { setError('РќР°Р·РІР°РЅРёРµ РѕР±СЏР·Р°С‚РµР»СЊРЅРѕ'); return }
    setSaving(true)
    setError('')
    const token = localStorage.getItem('admin_token')
    const body = {
      ...form,
      start_date: form.start_date || null,
      description: form.description || null,
      game: form.game || null,
      prize: form.prize || null,
      role_reward: form.role_reward || null,
      challonge_url: form.challonge_url || null,
      winner: form.winner || null,
      image_url: form.image_url || null,
    }
    try {
      const url = editing
        ? `${API_URL}/api/admin/tournaments/${editing.id}`
        : `${API_URL}/api/admin/tournaments`
      const res = await fetch(url, {
        method: editing ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      if (res.status === 401) {
        handleAdminAuthError()
        return
      }
      if (!res.ok) { setError('РћС€РёР±РєР° СЃРѕС…СЂР°РЅРµРЅРёСЏ'); return }
      setShowModal(false)
      fetch_()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('РЈРґР°Р»РёС‚СЊ С‚СѓСЂРЅРёСЂ?')) return
    const token = localStorage.getItem('admin_token')
    const response = await fetch(`${API_URL}/api/admin/tournaments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    if (response.status === 401) {
      handleAdminAuthError()
      return
    }
    fetch_()
  }

  const fmtDate = (s: string | null) => s
    ? new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : 'вЂ”'

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>в†ђ РќР°Р·Р°Рґ</button>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={22} /> РЈРїСЂР°РІР»РµРЅРёРµ С‚СѓСЂРЅРёСЂР°РјРё</h1>
        <button onClick={openCreate} className={styles.addButton} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={16} /> Р”РѕР±Р°РІРёС‚СЊ</button>
      </header>

      {loading ? (
        <div className={styles.loading}>Р—Р°РіСЂСѓР·РєР°...</div>
      ) : items.length === 0 ? (
        <div className={styles.list}>
          <div className={styles.empty}>
            <p>РўСѓСЂРЅРёСЂРѕРІ РїРѕРєР° РЅРµС‚</p>
            <button onClick={openCreate} className={styles.emptyButton}>РЎРѕР·РґР°С‚СЊ РїРµСЂРІС‹Р№ С‚СѓСЂРЅРёСЂ</button>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map(item => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{item.title}</h3>
                <div className={styles.cardActions}>
                  <span className={styles.published}>{STATUS_LABEL[item.status]} В· {item.type} {item.game ? `В· ${item.game}` : ''}</span>
                  <button onClick={() => setRegViewId(item.id)} className={styles.editButton} title="Р—Р°СЏРІРєРё"><Users size={15} /></button>
                  <button onClick={() => setBracketId(item.id)} className={styles.editButton} title="РЎРµС‚РєР°"><Network size={15} /></button>
                  <button onClick={() => openEdit(item)} className={styles.editButton} title="Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(item.id)} className={styles.deleteButton} title="РЈРґР°Р»РёС‚СЊ"><Trash2 size={15} /></button>
                </div>
              </div>
              {item.description && <p className={styles.cardContent}>{item.description}</p>}
              <div className={styles.cardFooter}>
                <span className={styles.date} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Calendar size={13} /> {fmtDate(item.start_date)}</span>
                {item.prize && <span className={styles.draft} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Trophy size={13} /> {item.prize}</span>}
                {item.winner && <span className={styles.published} style={{ display: 'flex', alignItems: 'center', gap: 5 }}><Crown size={13} /> {item.winner}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registrations viewer */}
      {regViewId !== null && (
        <RegViewer
          tournamentId={regViewId}
          token={localStorage.getItem('admin_token') ?? ''}
          onClose={() => setRegViewId(null)}
        />
      )}

      {/* Bracket manager */}
      {bracketId !== null && (
        <BracketManager
          tournamentId={bracketId}
          token={localStorage.getItem('admin_token') ?? ''}
          onClose={() => setBracketId(null)}
        />
      )}

      {/* Modal */}
      {showModal && (
        <div className={modalStyles.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={modalStyles.modal}>
            <div className={modalStyles.modalHeader}>
              <h2>{editing ? 'Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ С‚СѓСЂРЅРёСЂ' : 'РќРѕРІС‹Р№ С‚СѓСЂРЅРёСЂ'}</h2>
              <button className={modalStyles.close} onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <div className={modalStyles.body}>
              <label className={modalStyles.label}>
                РќР°Р·РІР°РЅРёРµ *
                <input
                  className={modalStyles.input}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="РќР°Р·РІР°РЅРёРµ С‚СѓСЂРЅРёСЂР°"
                />
              </label>

              <label className={modalStyles.label}>
                РћРїРёСЃР°РЅРёРµ
                <textarea
                  className={modalStyles.textarea}
                  value={form.description ?? ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="РћРїРёСЃР°РЅРёРµ"
                  rows={3}
                />
              </label>

              <div className={modalStyles.row}>
                <label className={modalStyles.label}>
                  РРіСЂР°
                  <input
                    className={modalStyles.input}
                    value={form.game ?? ''}
                    onChange={e => setForm(f => ({ ...f, game: e.target.value }))}
                    placeholder="Dota 2, CS2..."
                  />
                </label>

                <label className={modalStyles.label}>
                  РџСЂРёР·
                  <input
                    className={modalStyles.input}
                    value={form.prize ?? ''}
                    onChange={e => setForm(f => ({ ...f, prize: e.target.value }))}
                    placeholder="1000 в‚Ѕ, СЃРєРёРЅ..."
                  />
                </label>
              </div>

              <div className={modalStyles.row}>
                <label className={modalStyles.label}>
                  Р РѕР»СЊ (РЅР°РіСЂР°РґР°)
                  <input
                    className={modalStyles.input}
                    value={form.role_reward ?? ''}
                    onChange={e => setForm(f => ({ ...f, role_reward: e.target.value }))}
                    placeholder="Р§РµРјРїРёРѕРЅ С‚СѓСЂРЅРёСЂР°..."
                  />
                </label>

                <label className={modalStyles.label}>
                  РњР°РєСЃ. СѓС‡Р°СЃС‚РЅРёРєРѕРІ
                  <input
                    className={modalStyles.input}
                    type="number"
                    min={1}
                    value={form.max_participants ?? ''}
                    onChange={e => setForm(f => ({ ...f, max_participants: e.target.value ? Number(e.target.value) : null }))}
                    placeholder="32"
                  />
                </label>
              </div>

              <div className={modalStyles.row}>
                <label className={modalStyles.label}>
                  Р¤РѕСЂРјР°С‚
                  <select
                    className={modalStyles.select}
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as '1v1' | '5v5' }))}
                  >
                    <option value="1v1">1 РЅР° 1</option>
                    <option value="5v5">5 РЅР° 5</option>
                  </select>
                </label>

                <label className={modalStyles.label}>
                  РЎС‚Р°С‚СѓСЃ
                  <select
                    className={modalStyles.select}
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Tournament['status'] }))}
                  >
                    <option value="upcoming">РЎРєРѕСЂРѕ</option>
                    <option value="active">РРґС‘С‚</option>
                    <option value="completed">Р—Р°РІРµСЂС€С‘РЅ</option>
                  </select>
                </label>
              </div>

              <label className={modalStyles.label}>
                РљР°СЂС‚РёРЅРєР° (URL)
                <input
                  className={modalStyles.input}
                  value={form.image_url ?? ''}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </label>

              <div className={modalStyles.row}>
                <label className={modalStyles.label}>
                  Р”Р°С‚Р° РЅР°С‡Р°Р»Р°
                  <input
                    className={modalStyles.input}
                    type="datetime-local"
                    value={form.start_date ?? ''}
                    onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                  />
                </label>
              </div>

              {(form.status === 'completed' || editing?.status === 'completed') && (
                <label className={modalStyles.label}>
                  РџРѕР±РµРґРёС‚РµР»СЊ
                  <input
                    className={modalStyles.input}
                    value={form.winner ?? ''}
                    onChange={e => setForm(f => ({ ...f, winner: e.target.value }))}
                    placeholder="РќРёРє РїРѕР±РµРґРёС‚РµР»СЏ РёР»Рё РЅР°Р·РІР°РЅРёРµ РєРѕРјР°РЅРґС‹"
                  />
                </label>
              )}

              {error && <p className={modalStyles.error}>{error}</p>}
            </div>

            <div className={modalStyles.footer}>
              <button className={modalStyles.cancel} onClick={() => setShowModal(false)}>РћС‚РјРµРЅР°</button>
              <button className={modalStyles.save} onClick={handleSave} disabled={saving}>
                {saving ? 'РЎРѕС…СЂР°РЅРµРЅРёРµ...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


