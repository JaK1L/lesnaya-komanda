'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import styles from './page.module.css'

interface TeamMember {
  discord_id: number
  discord_username: string
  real_name?: string
  avatar_url?: string
  bio?: string
  forest_rank: string
  team_role?: string
  twitch_username?: string
  telegram_url?: string
  tiktok_url?: string
  youtube_url?: string
  is_team_member: boolean
  team_order: number
}

interface SearchUser {
  discord_id: number
  discord_username: string
  avatar_url?: string
  forest_rank: string
  is_team_member: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdminTeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await axios.get<TeamMember[]>(`${API_URL}/api/admin/team`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setMembers(response.data)
    } catch (err) {
      console.error('Error fetching team members:', err)
      alert('Ошибка загрузки команды')
    } finally {
      setLoading(false)
    }
  }

  const searchUsers = async () => {
    if (searchQuery.length < 2) return
    
    try {
      setSearching(true)
      const token = localStorage.getItem('token')
      const response = await axios.get<SearchUser[]>(
        `${API_URL}/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setSearchResults(response.data)
    } catch (err) {
      console.error('Error searching users:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember({ ...member })
  }

  const handleSave = async () => {
    if (!editingMember) return

    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_URL}/api/admin/team/${editingMember.discord_id}`,
        {
          discord_id: editingMember.discord_id,
          real_name: editingMember.real_name || null,
          bio: editingMember.bio || null,
          team_role: editingMember.team_role || null,
          telegram_url: editingMember.telegram_url || null,
          tiktok_url: editingMember.tiktok_url || null,
          youtube_url: editingMember.youtube_url || null,
          is_team_member: true,
          team_order: editingMember.team_order
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setEditingMember(null)
      fetchTeamMembers()
      alert('Сохранено!')
    } catch (err) {
      console.error('Error saving member:', err)
      alert('Ошибка сохранения')
    }
  }

  const handleRemove = async (discord_id: number) => {
    if (!confirm('Убрать из команды?')) return

    try {
      const token = localStorage.getItem('token')
      await axios.delete(`${API_URL}/api/admin/team/${discord_id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      fetchTeamMembers()
      alert('Удалено из команды')
    } catch (err) {
      console.error('Error removing member:', err)
      alert('Ошибка удаления')
    }
  }

  const handleAddUser = async (user: SearchUser) => {
    try {
      const token = localStorage.getItem('token')
      await axios.put(
        `${API_URL}/api/admin/team/${user.discord_id}`,
        {
          discord_id: user.discord_id,
          is_team_member: true,
          team_order: members.length
        },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      
      setSearchQuery('')
      setSearchResults([])
      fetchTeamMembers()
      alert('Добавлен в команду!')
    } catch (err) {
      console.error('Error adding user:', err)
      alert('Ошибка добавления')
    }
  }

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Управление командой</h1>
        <p>Добавляйте и редактируйте информацию о членах команды</p>
      </div>

      {/* Поиск пользователей */}
      <div className={styles.searchSection}>
        <h2>Добавить в команду</h2>
        <div className={styles.searchBox}>
          <input
            type="text"
            placeholder="Поиск пользователя..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
          />
          <button onClick={searchUsers} disabled={searching}>
            {searching ? 'Поиск...' : 'Найти'}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div className={styles.searchResults}>
            {searchResults.map((user) => (
              <div key={user.discord_id} className={styles.searchResult}>
                <div className={styles.userInfo}>
                  {user.avatar_url && (
                    <img src={user.avatar_url} alt={user.discord_username} />
                  )}
                  <div>
                    <div className={styles.userName}>{user.discord_username}</div>
                    <div className={styles.userRank}>{user.forest_rank}</div>
                  </div>
                </div>
                {user.is_team_member ? (
                  <span className={styles.badge}>Уже в команде</span>
                ) : (
                  <button onClick={() => handleAddUser(user)}>Добавить</button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Список команды */}
      <div className={styles.teamList}>
        <h2>Текущая команда ({members.length})</h2>
        
        {members.length === 0 ? (
          <p className={styles.empty}>Команда пуста. Добавьте участников через поиск выше.</p>
        ) : (
          <div className={styles.members}>
            {members.map((member) => (
              <div key={member.discord_id} className={styles.memberCard}>
                {editingMember?.discord_id === member.discord_id ? (
                  <div className={styles.editForm}>
                    <div className={styles.formRow}>
                      <label>Discord: {member.discord_username}</label>
                    </div>
                    
                    <div className={styles.formRow}>
                      <label>Реальное имя</label>
                      <input
                        type="text"
                        value={editingMember.real_name || ''}
                        onChange={(e) => setEditingMember({...editingMember, real_name: e.target.value})}
                        placeholder="Иван Иванов"
                      />
                    </div>

                    <div className={styles.formRow}>
                      <label>Роль в команде</label>
                      <input
                        type="text"
                        value={editingMember.team_role || ''}
                        onChange={(e) => setEditingMember({...editingMember, team_role: e.target.value})}
                        placeholder="Стример / Модератор / и т.д."
                      />
                    </div>

                    <div className={styles.formRow}>
                      <label>Биография</label>
                      <textarea
                        value={editingMember.bio || ''}
                        onChange={(e) => setEditingMember({...editingMember, bio: e.target.value})}
                        placeholder="Расскажите о себе..."
                        rows={4}
                      />
                    </div>

                    <div className={styles.formRow}>
                      <label>Telegram URL</label>
                      <input
                        type="text"
                        value={editingMember.telegram_url || ''}
                        onChange={(e) => setEditingMember({...editingMember, telegram_url: e.target.value})}
                        placeholder="https://t.me/username"
                      />
                    </div>

                    <div className={styles.formRow}>
                      <label>TikTok URL</label>
                      <input
                        type="text"
                        value={editingMember.tiktok_url || ''}
                        onChange={(e) => setEditingMember({...editingMember, tiktok_url: e.target.value})}
                        placeholder="https://tiktok.com/@username"
                      />
                    </div>

                    <div className={styles.formRow}>
                      <label>YouTube URL</label>
                      <input
                        type="text"
                        value={editingMember.youtube_url || ''}
                        onChange={(e) => setEditingMember({...editingMember, youtube_url: e.target.value})}
                        placeholder="https://youtube.com/@username"
                      />
                    </div>

                    <div className={styles.formRow}>
                      <label>Порядок отображения</label>
                      <input
                        type="number"
                        value={editingMember.team_order}
                        onChange={(e) => setEditingMember({...editingMember, team_order: parseInt(e.target.value) || 0})}
                        min="0"
                      />
                    </div>

                    <div className={styles.formActions}>
                      <button onClick={handleSave} className={styles.btnSave}>
                        Сохранить
                      </button>
                      <button onClick={() => setEditingMember(null)} className={styles.btnCancel}>
                        Отмена
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.memberView}>
                    <div className={styles.memberHeader}>
                      {member.avatar_url && (
                        <img src={member.avatar_url} alt={member.discord_username} />
                      )}
                      <div>
                        <h3>{member.real_name || member.discord_username}</h3>
                        <p className={styles.memberRole}>{member.team_role || member.forest_rank}</p>
                        <p className={styles.memberOrder}>Порядок: {member.team_order}</p>
                      </div>
                    </div>
                    
                    {member.bio && (
                      <p className={styles.memberBio}>{member.bio}</p>
                    )}

                    <div className={styles.memberActions}>
                      <button onClick={() => handleEdit(member)} className={styles.btnEdit}>
                        Редактировать
                      </button>
                      <button onClick={() => handleRemove(member.discord_id)} className={styles.btnRemove}>
                        Убрать из команды
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
