'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy, Pencil, Trash2, Calendar, Crown, Plus } from 'lucide-react'
import styles from '../news/page.module.css'
import modalStyles from './modal.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Tournament {
  id: number
  title: string
  description: string | null
  game: string | null
  prize: string | null
  challonge_url: string | null
  start_date: string | null
  status: 'upcoming' | 'active' | 'completed'
  winner: string | null
}

const EMPTY: Omit<Tournament, 'id'> = {
  title: '',
  description: '',
  game: '',
  prize: '',
  challonge_url: '',
  start_date: '',
  status: 'upcoming',
  winner: '',
}

const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Скоро',
  active: 'Идёт',
  completed: 'Завершён',
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
      challonge_url: item.challonge_url ?? '',
      start_date: item.start_date ? item.start_date.slice(0, 16) : '',
      status: item.status,
      winner: item.winner ?? '',
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
      challonge_url: form.challonge_url || null,
      winner: form.winner || null,
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
                  <span className={styles.published}>{STATUS_LABEL[item.status]} {item.game ? `· ${item.game}` : ''}</span>
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

      {/* Modal */}
      {showModal && (
        <div className={modalStyles.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={modalStyles.modal}>
            <div className={modalStyles.modalHeader}>
              <h2>{editing ? 'Редактировать турнир' : 'Новый турнир'}</h2>
              <button className={modalStyles.close} onClick={() => setShowModal(false)}>✕</button>
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

              <label className={modalStyles.label}>
                Ссылка Challonge
                <input
                  className={modalStyles.input}
                  value={form.challonge_url ?? ''}
                  onChange={e => setForm(f => ({ ...f, challonge_url: e.target.value }))}
                  placeholder="https://challonge.com/your_tournament"
                />
                <span className={modalStyles.hint}>Вставьте URL турнира с challonge.com</span>
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
