'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Pencil, Trash2, Calendar, Crown, Plus, X, Users, Network } from 'lucide-react'
import styles from '../news/page.module.css'
import modalStyles from './modal.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

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
  upcoming: 'Скоро',
  active: 'Идёт',
  completed: 'Завершён',
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
      .then(r => r.json())
      .then(data => { setRegs(data); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadRegs() }, [tournamentId, token])

  const handleDelete = async (regId: number) => {
    if (!confirm('Удалить заявку?')) return
    await fetch(`${API_URL}/api/admin/tournaments/${tournamentId}/registrations/${regId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    loadRegs()
  }

  return (
    <div className={modalStyles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={modalStyles.modal}>
        <div className={modalStyles.modalHeader}>
          <h2>Заявки</h2>
          <button className={modalStyles.close} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={modalStyles.body}>
          {loading ? (
            <p style={{ color: '#888' }}>Загрузка...</p>
          ) : regs.length === 0 ? (
            <p style={{ color: '#888' }}>Заявок пока нет</p>
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
                    <span style={{ color: '#fff', fontWeight: 600 }}>Команда: {r.team_name}</span>
                    {r.players && <span style={{ color: '#aaa' }}>Игроки: {r.players.join(', ')}</span>}
                    {r.contact && <span style={{ color: '#888' }}>Контакт: {r.contact}</span>}
                  </div>
                )}
                <button
                  onClick={() => handleDelete(r.id)}
                  style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', padding: '2px 4px', flexShrink: 0 }}
                  title="Удалить заявку"
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

interface Match {
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

function BracketManager({ tournamentId, token, onClose }: { tournamentId: number; token: string; onClose: () => void }) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [bracketType, setBracketType] = useState<'single' | 'double'>('single')
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState('')
  const [customPlayers, setCustomPlayers] = useState('')  // one per line
  const [editMatch, setEditMatch] = useState<Match | null>(null)
  const [score1, setScore1] = useState(0)
  const [score2, setScore2] = useState(0)
  const [winner, setWinner] = useState('')

  const load = () => {
    setLoading(true)
    fetch(`${API_URL}/api/tournaments/${tournamentId}/bracket`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(d => { setMatches(Array.isArray(d) ? d : []); setLoading(false) }).catch(() => setLoading(false))
  }

  useEffect(() => { load() }, [tournamentId])

  const generate = async () => {
    if (!confirm(`Сформировать сетку (${bracketType === 'single' ? 'Single' : 'Double'} Elimination)? Старая сетка будет удалена.`)) return
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
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setGenError(data.detail || `Ошибка ${res.status}`)
      } else {
        load()
      }
    } catch {
      setGenError('Ошибка сети')
    } finally {
      setGenerating(false)
    }
  }

  const reset = async () => {
    if (!confirm('Удалить сетку полностью?')) return
    await fetch(`${API_URL}/api/admin/tournaments/${tournamentId}/bracket`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
    load()
  }

  const saveMatch = async () => {
    if (!editMatch || !winner) return
    await fetch(`${API_URL}/api/admin/bracket/match/${editMatch.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ winner_name: winner, score1, score2 })
    })
    setEditMatch(null)
    load()
  }

  const rounds = matches.reduce<Record<string, Record<number, Match[]>>>((acc, m) => {
    if (!acc[m.section]) acc[m.section] = {}
    if (!acc[m.section][m.round]) acc[m.section][m.round] = []
    acc[m.section][m.round].push(m)
    return acc
  }, {})

  const sectionLabel: Record<string, string> = { winners: 'Победители', losers: 'Проигравшие', grand_final: 'Гранд-финал' }

  return (
    <div className={modalStyles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={modalStyles.modal} style={{ maxWidth: 700, maxHeight: '90vh', overflow: 'auto' }}>
        <div className={modalStyles.modalHeader}>
          <h2 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Network size={18} /> Сетка турнира</h2>
          <button className={modalStyles.close} onClick={onClose}><X size={16} /></button>
        </div>
        <div className={modalStyles.body}>
          {/* Controls */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <select className={modalStyles.select} value={bracketType} onChange={e => setBracketType(e.target.value as 'single' | 'double')} style={{ width: 'auto' }}>
              <option value="single">Single Elimination</option>
              <option value="double">Double Elimination</option>
            </select>
            <button onClick={generate} disabled={generating} style={{ padding: '6px 14px', background: '#4f9fff', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {generating ? 'Генерация...' : 'Сформировать'}
            </button>
            {matches.length > 0 && (
              <button onClick={reset} style={{ padding: '6px 14px', background: '#c0392b', border: 'none', color: '#fff', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>
                Сбросить
              </button>
            )}
          </div>

          {/* Custom players input */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 4 }}>
              Участники вручную (по одному на строку). Если оставить пустым — берутся из заявок.
            </label>
            <textarea
              value={customPlayers}
              onChange={e => setCustomPlayers(e.target.value)}
              placeholder={'Игрок 1\nИгрок 2\nИгрок 3\n...'}
              rows={4}
              style={{ width: '100%', background: '#111', border: '1px solid #2a2f36', borderRadius: 8, color: '#fff', padding: '8px', fontSize: 13, resize: 'vertical', boxSizing: 'border-box' }}
            />
          </div>

          {genError && <p style={{ color: '#e74c3c', fontSize: 13, marginBottom: 8 }}>{genError}</p>}
          {loading && <p style={{ color: '#888' }}>Загрузка...</p>}
          {!loading && matches.length === 0 && !genError && <p style={{ color: '#888' }}>Сетка не сформирована. Введите участников и нажмите "Сформировать".</p>}

          {/* Matches grouped by section and round */}
          {['winners', 'losers', 'grand_final'].filter(s => rounds[s]).map(section => (
            <div key={section} style={{ marginBottom: 20 }}>
              <h4 style={{ color: '#4f9fff', fontSize: 12, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 10px 0' }}>{sectionLabel[section]}</h4>
              {Object.entries(rounds[section]).sort((a, b) => Number(a[0]) - Number(b[0])).map(([rnd, ms]) => (
                <div key={rnd} style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, color: '#666', marginBottom: 6 }}>Раунд {rnd}</div>
                  {ms.filter(m => !m.is_bye).map(m => (
                    <div key={m.id} onClick={() => { if (m.status !== 'bye') { setEditMatch(m); setScore1(m.score1 ?? 0); setScore2(m.score2 ?? 0); setWinner(m.winner_name ?? '') } }}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', background: m.status === 'completed' ? '#1a2a1a' : '#1a1e24', border: '1px solid #2a2f36', borderRadius: 8, marginBottom: 6, cursor: 'pointer', fontSize: 13 }}>
                      <span style={{ flex: 1, color: m.winner_name === m.player1_name ? '#4f9fff' : '#fff' }}>{m.player1_name || 'TBD'}</span>
                      <span style={{ color: '#555', fontSize: 11 }}>vs</span>
                      <span style={{ flex: 1, textAlign: 'right', color: m.winner_name === m.player2_name ? '#4f9fff' : '#fff' }}>{m.player2_name || 'TBD'}</span>
                      {m.status === 'completed' && <span style={{ fontSize: 11, color: '#4f9fff', marginLeft: 4 }}>{m.score1}:{m.score2}</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Edit match modal */}
      {editMatch && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setEditMatch(null)}>
          <div style={{ background: '#1a1e24', border: '1px solid #333', borderRadius: 16, padding: '1.5rem', width: 340 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ margin: '0 0 16px', color: '#fff', fontSize: 15 }}>
              {editMatch.player1_name || 'TBD'} vs {editMatch.player2_name || 'TBD'}
            </h3>
            <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
              <input type="number" min={0} value={score1} onChange={e => setScore1(Number(e.target.value))}
                style={{ flex: 1, padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff', textAlign: 'center' }} />
              <span style={{ color: '#555', alignSelf: 'center' }}>:</span>
              <input type="number" min={0} value={score2} onChange={e => setScore2(Number(e.target.value))}
                style={{ flex: 1, padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff', textAlign: 'center' }} />
            </div>
            <label style={{ display: 'block', fontSize: 12, color: '#888', marginBottom: 6 }}>Победитель</label>
            <select value={winner} onChange={e => setWinner(e.target.value)}
              style={{ width: '100%', padding: '8px', background: '#111', border: '1px solid #444', borderRadius: 8, color: '#fff', marginBottom: 14 }}>
              <option value="">— выбери —</option>
              {editMatch.player1_name && <option value={editMatch.player1_name}>{editMatch.player1_name}</option>}
              {editMatch.player2_name && <option value={editMatch.player2_name}>{editMatch.player2_name}</option>}
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={saveMatch} disabled={!winner} style={{ flex: 1, padding: '8px', background: '#4f9fff', border: 'none', borderRadius: 8, color: '#fff', fontWeight: 600, cursor: 'pointer' }}>Сохранить</button>
              <button onClick={() => setEditMatch(null)} style={{ flex: 1, padding: '8px', background: '#333', border: 'none', borderRadius: 8, color: '#fff', cursor: 'pointer' }}>Отмена</button>
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
    if (!form.title.trim()) { setError('Название обязательно'); return }
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
      if (!res.ok) { setError('Ошибка сохранения'); return }
      setShowModal(false)
      fetch_()
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить турнир?')) return
    const token = localStorage.getItem('admin_token')
    await fetch(`${API_URL}/api/admin/tournaments/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    })
    fetch_()
  }

  const fmtDate = (s: string | null) => s
    ? new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—'

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>← Назад</button>
        <h1 style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Trophy size={22} /> Управление турнирами</h1>
        <button onClick={openCreate} className={styles.addButton} style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Plus size={16} /> Добавить</button>
      </header>

      {loading ? (
        <div className={styles.loading}>Загрузка...</div>
      ) : items.length === 0 ? (
        <div className={styles.list}>
          <div className={styles.empty}>
            <p>Турниров пока нет</p>
            <button onClick={openCreate} className={styles.emptyButton}>Создать первый турнир</button>
          </div>
        </div>
      ) : (
        <div className={styles.list}>
          {items.map(item => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <h3>{item.title}</h3>
                <div className={styles.cardActions}>
                  <span className={styles.published}>{STATUS_LABEL[item.status]} · {item.type} {item.game ? `· ${item.game}` : ''}</span>
                  <button onClick={() => setRegViewId(item.id)} className={styles.editButton} title="Заявки"><Users size={15} /></button>
                  <button onClick={() => setBracketId(item.id)} className={styles.editButton} title="Сетка"><Network size={15} /></button>
                  <button onClick={() => openEdit(item)} className={styles.editButton} title="Редактировать"><Pencil size={15} /></button>
                  <button onClick={() => handleDelete(item.id)} className={styles.deleteButton} title="Удалить"><Trash2 size={15} /></button>
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
              <h2>{editing ? 'Редактировать турнир' : 'Новый турнир'}</h2>
              <button className={modalStyles.close} onClick={() => setShowModal(false)}><X size={16} /></button>
            </div>

            <div className={modalStyles.body}>
              <label className={modalStyles.label}>
                Название *
                <input
                  className={modalStyles.input}
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="Название турнира"
                />
              </label>

              <label className={modalStyles.label}>
                Описание
                <textarea
                  className={modalStyles.textarea}
                  value={form.description ?? ''}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Описание"
                  rows={3}
                />
              </label>

              <div className={modalStyles.row}>
                <label className={modalStyles.label}>
                  Игра
                  <input
                    className={modalStyles.input}
                    value={form.game ?? ''}
                    onChange={e => setForm(f => ({ ...f, game: e.target.value }))}
                    placeholder="Dota 2, CS2..."
                  />
                </label>

                <label className={modalStyles.label}>
                  Приз
                  <input
                    className={modalStyles.input}
                    value={form.prize ?? ''}
                    onChange={e => setForm(f => ({ ...f, prize: e.target.value }))}
                    placeholder="1000 ₽, скин..."
                  />
                </label>
              </div>

              <div className={modalStyles.row}>
                <label className={modalStyles.label}>
                  Роль (награда)
                  <input
                    className={modalStyles.input}
                    value={form.role_reward ?? ''}
                    onChange={e => setForm(f => ({ ...f, role_reward: e.target.value }))}
                    placeholder="Чемпион турнира..."
                  />
                </label>

                <label className={modalStyles.label}>
                  Макс. участников
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
                  Формат
                  <select
                    className={modalStyles.select}
                    value={form.type}
                    onChange={e => setForm(f => ({ ...f, type: e.target.value as '1v1' | '5v5' }))}
                  >
                    <option value="1v1">1 на 1</option>
                    <option value="5v5">5 на 5</option>
                  </select>
                </label>

                <label className={modalStyles.label}>
                  Статус
                  <select
                    className={modalStyles.select}
                    value={form.status}
                    onChange={e => setForm(f => ({ ...f, status: e.target.value as Tournament['status'] }))}
                  >
                    <option value="upcoming">Скоро</option>
                    <option value="active">Идёт</option>
                    <option value="completed">Завершён</option>
                  </select>
                </label>
              </div>

              <label className={modalStyles.label}>
                Картинка (URL)
                <input
                  className={modalStyles.input}
                  value={form.image_url ?? ''}
                  onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                  placeholder="https://..."
                />
              </label>

              <div className={modalStyles.row}>
                <label className={modalStyles.label}>
                  Дата начала
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
                  Победитель
                  <input
                    className={modalStyles.input}
                    value={form.winner ?? ''}
                    onChange={e => setForm(f => ({ ...f, winner: e.target.value }))}
                    placeholder="Ник победителя или название команды"
                  />
                </label>
              )}

              {error && <p className={modalStyles.error}>{error}</p>}
            </div>

            <div className={modalStyles.footer}>
              <button className={modalStyles.cancel} onClick={() => setShowModal(false)}>Отмена</button>
              <button className={modalStyles.save} onClick={handleSave} disabled={saving}>
                {saving ? 'Сохранение...' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
