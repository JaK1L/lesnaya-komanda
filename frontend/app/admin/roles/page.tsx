'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import styles from '../news/page.module.css'
import roleStyles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface Role { id: number; name: string; color: string }
interface UserRow { id: number; discord_username: string; avatar_url?: string; roles: Role[] }

export default function RolesAdminPage() {
  const router = useRouter()
  const [roles, setRoles] = useState<Role[]>([])
  const [users, setUsers] = useState<UserRow[]>([])
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])

  // Create / Edit form
  const [editRole, setEditRole] = useState<Role | null>(null)
  const [formName, setFormName] = useState('')
  const [formColor, setFormColor] = useState('#99aab5')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const token = typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }

  const loadRoles = async () => {
    const r = await fetch(`${API_URL}/api/admin/roles`, { headers })
    if (r.ok) setRoles(await r.json())
  }

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); return }
    const r = await fetch(`${API_URL}/api/admin/users/search?q=${encodeURIComponent(q)}&limit=10`, { headers })
    if (r.ok) setSearchResults(await r.json())
  }

  useEffect(() => { loadRoles() }, [])
  useEffect(() => { const t = setTimeout(() => searchUsers(search), 300); return () => clearTimeout(t) }, [search])

  const openCreate = () => { setEditRole(null); setFormName(''); setFormColor('#99aab5'); setError('') }
  const openEdit = (r: Role) => { setEditRole(r); setFormName(r.name); setFormColor(r.color); setError('') }

  const saveRole = async () => {
    if (!formName.trim()) { setError('Название обязательно'); return }
    setSaving(true)
    try {
      const res = editRole
        ? await fetch(`${API_URL}/api/admin/roles/${editRole.id}`, { method: 'PUT', headers, body: JSON.stringify({ name: formName.trim(), color: formColor }) })
        : await fetch(`${API_URL}/api/admin/roles`, { method: 'POST', headers, body: JSON.stringify({ name: formName.trim(), color: formColor }) })
      if (!res.ok) { const d = await res.json(); throw new Error(d.detail || 'Ошибка') }
      await loadRoles()
      setEditRole(null); setFormName(''); setFormColor('#99aab5')
    } catch (e: any) { setError(e.message) }
    setSaving(false)
  }

  const deleteRole = async (id: number) => {
    if (!confirm('Удалить роль?')) return
    await fetch(`${API_URL}/api/admin/roles/${id}`, { method: 'DELETE', headers })
    await loadRoles()
  }

  const getUserRoles = async (userId: number): Promise<Role[]> => {
    const r = await fetch(`${API_URL}/api/admin/users/${userId}/roles`, { headers })
    return r.ok ? r.json() : []
  }

  const addUserToList = async (user: any) => {
    const userRoles = await getUserRoles(user.id)
    setUsers(prev => prev.find(u => u.id === user.id)
      ? prev
      : [...prev, { id: user.id, discord_username: user.discord_username, avatar_url: user.avatar_url, roles: userRoles }]
    )
    setSearch(''); setSearchResults([])
  }

  const assignRole = async (userId: number, roleId: number) => {
    await fetch(`${API_URL}/api/admin/users/${userId}/roles/${roleId}`, { method: 'POST', headers })
    const updated = await getUserRoles(userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: updated } : u))
  }

  const removeUserRole = async (userId: number, roleId: number) => {
    await fetch(`${API_URL}/api/admin/users/${userId}/roles/${roleId}`, { method: 'DELETE', headers })
    const updated = await getUserRoles(userId)
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, roles: updated } : u))
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button className={styles.backButton} onClick={() => router.push('/admin')}>← Назад</button>
        <h1>🎭 Управление ролями</h1>
      </header>

      <div className={roleStyles.layout}>
        {/* Left: roles list + form */}
        <section className={roleStyles.panel}>
          <h2 className={roleStyles.panelTitle}>Роли</h2>

          <div className={roleStyles.form}>
            <input
              className={roleStyles.input}
              placeholder="Название роли"
              value={formName}
              onChange={e => setFormName(e.target.value)}
            />
            <div className={roleStyles.colorRow}>
              <label className={roleStyles.colorLabel}>Цвет:</label>
              <input type="color" value={formColor} onChange={e => setFormColor(e.target.value)} className={roleStyles.colorPicker} />
              <span className={roleStyles.colorHex}>{formColor}</span>
            </div>
            {error && <div className={roleStyles.error}>{error}</div>}
            <div className={roleStyles.formButtons}>
              <button className={roleStyles.saveBtn} onClick={saveRole} disabled={saving}>
                {saving ? '...' : editRole ? 'Сохранить' : 'Создать'}
              </button>
              {editRole && <button className={roleStyles.cancelBtn} onClick={openCreate}>Отмена</button>}
            </div>
          </div>

          <div className={roleStyles.roleList}>
            {roles.map(r => (
              <div key={r.id} className={roleStyles.roleRow}>
                <span className={roleStyles.roleDot} style={{ background: r.color }} />
                <span className={roleStyles.roleName} style={{ color: r.color }}>{r.name}</span>
                <div className={roleStyles.roleActions}>
                  <button className={roleStyles.editBtn} onClick={() => openEdit(r)}>✏️</button>
                  <button className={roleStyles.delBtn} onClick={() => deleteRole(r.id)}>🗑️</button>
                </div>
              </div>
            ))}
            {roles.length === 0 && <p className={roleStyles.empty}>Нет ролей</p>}
          </div>
        </section>

        {/* Right: assign roles to users */}
        <section className={roleStyles.panel}>
          <h2 className={roleStyles.panelTitle}>Назначить роли пользователям</h2>

          <div className={roleStyles.searchWrap}>
            <input
              className={roleStyles.input}
              placeholder="Поиск пользователя..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {searchResults.length > 0 && (
              <div className={roleStyles.dropdown}>
                {searchResults.map(u => (
                  <button key={u.id} className={roleStyles.dropItem} onClick={() => addUserToList(u)}>
                    {u.discord_username}
                  </button>
                ))}
              </div>
            )}
          </div>

          {users.map(user => (
            <div key={user.id} className={roleStyles.userCard}>
              <div className={roleStyles.userHeader}>
                <strong>{user.discord_username}</strong>
              </div>
              <div className={roleStyles.userRoles}>
                {user.roles.map(r => (
                  <span key={r.id} className={roleStyles.roleBadge} style={{ background: r.color + '22', border: `1px solid ${r.color}`, color: r.color }}>
                    {r.name}
                    <button className={roleStyles.removeBadge} onClick={() => removeUserRole(user.id, r.id)}>×</button>
                  </span>
                ))}
              </div>
              <div className={roleStyles.addRoleRow}>
                <select className={roleStyles.select} onChange={e => { if (e.target.value) assignRole(user.id, Number(e.target.value)); e.target.value = '' }}>
                  <option value="">+ Добавить роль</option>
                  {roles.filter(r => !user.roles.find(ur => ur.id === r.id)).map(r => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
            </div>
          ))}
          {users.length === 0 && <p className={roleStyles.empty}>Найдите пользователя выше</p>}
        </section>
      </div>
    </div>
  )
}
