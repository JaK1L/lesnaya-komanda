'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { TeamModal } from '../../../components/admin/TeamModal'
import { AdminTableSkeleton } from '../../../components/skeletons'
import styles from '../news/page.module.css'

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

export default function AdminTeamPage() {
  const router = useRouter()
  const [members, setMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchUser[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchTeamMembers()
  }, [router])

  const fetchTeamMembers = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/team`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setMembers(data)
    } catch (error) {
      console.error('Error fetching team members:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchUsers = async () => {
    if (searchQuery.length < 2) return
    
    try {
      setSearching(true)
      const token = localStorage.getItem('admin_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users/search?q=${encodeURIComponent(searchQuery)}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )
      
      if (response.ok) {
        const data = await response.json()
        setSearchResults(data)
      }
    } catch (err) {
      console.error('Error searching users:', err)
    } finally {
      setSearching(false)
    }
  }

  const handleAddUser = async (user: SearchUser) => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/team/${user.discord_id}`,
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            discord_id: user.discord_id,
            is_team_member: true,
            team_order: members.length
          }),
        }
      )
      
      if (!response.ok) throw new Error('Failed to add')
      
      setSearchQuery('')
      setSearchResults([])
      fetchTeamMembers()
      alert('Добавлен в команду!')
    } catch (err) {
      console.error('Error adding user:', err)
      alert('Ошибка добавления')
    }
  }

  const handleRemove = async (discord_id: number) => {
    if (!confirm('Убрать из команды?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/team/${discord_id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      )

      if (!response.ok) throw new Error('Failed to remove')
      
      fetchTeamMembers()
    } catch (error) {
      console.error('Error removing member:', error)
      alert('Ошибка удаления')
    }
  }

  const handleEdit = (member: TeamMember) => {
    setEditingMember(member)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMember(null)
  }

  const handleSave = () => {
    fetchTeamMembers()
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>👥 Управление командой</h1>
          <div style={{ width: '120px' }} />
        </header>
        <AdminTableSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          ← Назад
        </button>
        <h1>👥 Управление командой</h1>
        <div style={{ color: '#888' }}>Участников: {members.length}</div>
      </header>

      <TeamModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingMember={editingMember}
      />

      {/* Поиск пользователей */}
      <div style={{ 
        background: '#2a2a2a', 
        padding: '1.5rem', 
        borderRadius: '12px', 
        marginBottom: '2rem',
        border: '1px solid #444'
      }}>
        <h2 style={{ marginTop: 0, marginBottom: '1rem' }}>Добавить в команду</h2>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="Поиск пользователя..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
            style={{
              flex: 1,
              padding: '0.75rem',
              background: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '8px',
              color: '#fff',
              fontSize: '1rem',
            }}
          />
          <button 
            onClick={searchUsers} 
            disabled={searching}
            style={{
              padding: '0.75rem 1.5rem',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: searching ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              opacity: searching ? 0.6 : 1,
            }}
          >
            {searching ? 'Поиск...' : 'Найти'}
          </button>
        </div>
        
        {searchResults.length > 0 && (
          <div style={{ marginTop: '1rem' }}>
            {searchResults.map((user) => (
              <div 
                key={user.discord_id} 
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem',
                  background: '#1a1a1a',
                  borderRadius: '8px',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {user.avatar_url && (
                    <img 
                      src={user.avatar_url} 
                      alt={user.discord_username}
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div>
                    <div style={{ fontWeight: 600 }}>{user.discord_username}</div>
                    <div style={{ color: '#888', fontSize: '0.9rem' }}>{user.forest_rank}</div>
                  </div>
                </div>
                {user.is_team_member ? (
                  <span style={{ color: '#888' }}>Уже в команде</span>
                ) : (
                  <button 
                    onClick={() => handleAddUser(user)}
                    style={{
                      padding: '0.5rem 1rem',
                      background: '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    Добавить
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.list}>
        {members.length === 0 ? (
          <div className={styles.empty}>
            <p>Команда пуста</p>
            <p style={{ color: '#888', fontSize: '0.9rem' }}>
              Добавьте участников через поиск выше
            </p>
          </div>
        ) : (
          members.map((member) => (
            <div key={member.discord_id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {member.avatar_url && (
                    <img 
                      src={member.avatar_url} 
                      alt={member.discord_username}
                      style={{ 
                        width: '64px', 
                        height: '64px', 
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div>
                    <h3>{member.real_name || member.discord_username}</h3>
                    <p style={{ color: '#888', margin: '0.25rem 0', fontSize: '0.9rem' }}>
                      {member.team_role || member.forest_rank}
                    </p>
                    {member.bio && (
                      <p style={{ color: '#aaa', margin: '0.5rem 0', fontSize: '0.85rem' }}>
                        {member.bio}
                      </p>
                    )}
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                      {member.telegram_url && (
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>📱 Telegram</span>
                      )}
                      {member.tiktok_url && (
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>🎵 TikTok</span>
                      )}
                      {member.youtube_url && (
                        <span style={{ fontSize: '0.85rem', color: '#888' }}>📺 YouTube</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <span style={{ color: '#888', fontSize: '0.85rem' }}>
                    Порядок: {member.team_order}
                  </span>
                  <button
                    onClick={() => handleEdit(member)}
                    className={styles.editButton}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleRemove(member.discord_id)}
                    className={styles.deleteButton}
                    title="Убрать из команды"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
