'use client'

import { useState, useEffect } from 'react'
import axios from 'axios'
import { Award, TrendingUp, Coins, Users, Search } from 'lucide-react'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface User {
  discord_id: number
  discord_username: string
  avatar_url?: string
  level: number
  current_xp: number
  total_xp: number
  points: number
  forest_rank: string
}

export default function XPManagementPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [showModal, setShowModal] = useState(false)
  
  // Форма для добавления XP/Points
  const [transactionType, setTransactionType] = useState<'xp' | 'points'>('xp')
  const [amount, setAmount] = useState(0)
  const [reason, setReason] = useState('')
  
  // Форма для прямого редактирования
  const [editMode, setEditMode] = useState(false)
  const [editLevel, setEditLevel] = useState(1)
  const [editCurrentXP, setEditCurrentXP] = useState(0)
  const [editTotalXP, setEditTotalXP] = useState(0)
  const [editPoints, setEditPoints] = useState(0)

  useEffect(() => {
    fetchUsers()
  }, [])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const response = await axios.get<User[]>(`${API_URL}/api/xp/leaderboard?by=level&limit=100`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setLoading(false)
    }
  }

  const openModal = (user: User) => {
    setSelectedUser(user)
    setEditLevel(user.level)
    setEditCurrentXP(user.current_xp)
    setEditTotalXP(user.total_xp)
    setEditPoints(user.points)
    setAmount(0)
    setReason('')
    setEditMode(false)
    setShowModal(true)
  }

  const closeModal = () => {
    setShowModal(false)
    setSelectedUser(null)
    setEditMode(false)
  }

  const handleAddTransaction = async () => {
    if (!selectedUser || !reason.trim() || amount === 0) {
      alert('Заполните все поля')
      return
    }

    try {
      const token = localStorage.getItem('admin_token')
      const endpoint = transactionType === 'xp' ? '/api/xp/add-xp' : '/api/xp/add-points'
      
      await axios.post(
        `${API_URL}${endpoint}`,
        {
          discord_id: selectedUser.discord_id,
          type: transactionType,
          amount: amount,
          reason: reason,
          source: 'admin'
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      alert(`Успешно добавлено ${amount} ${transactionType === 'xp' ? 'опыта' : 'поинтов'}`)
      closeModal()
      fetchUsers()
    } catch (error: any) {
      console.error('Error adding transaction:', error)
      alert(`Ошибка: ${error.response?.data?.detail || error.message}`)
    }
  }

  const handleDirectUpdate = async () => {
    if (!selectedUser) return

    try {
      const token = localStorage.getItem('admin_token')
      
      await axios.put(
        `${API_URL}/api/xp/update-user`,
        {
          discord_id: selectedUser.discord_id,
          level: editLevel,
          current_xp: editCurrentXP,
          total_xp: editTotalXP,
          points: editPoints
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      alert('Данные пользователя обновлены')
      closeModal()
      fetchUsers()
    } catch (error: any) {
      console.error('Error updating user:', error)
      alert(`Ошибка: ${error.response?.data?.detail || error.message}`)
    }
  }

  const filteredUsers = users.filter(user =>
    user.discord_username.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const xpForLevel = (level: number) => level * 100

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: 'Unbounded', fontSize: '2rem', marginBottom: '0.5rem' }}>
          УПРАВЛЕНИЕ ОПЫТОМ И ПОИНТАМИ
        </h1>
        <p style={{ color: '#666' }}>
          Добавляйте опыт и поинты пользователям, управляйте уровнями
        </p>
      </div>

      {/* Статистика */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{ 
          background: 'var(--gray)', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid var(--gray-light)'
        }}>
          <Users size={24} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
            {users.length}
          </div>
          <div style={{ color: '#666', fontSize: '0.875rem' }}>ВСЕГО ИГРОКОВ</div>
        </div>

        <div style={{ 
          background: 'var(--gray)', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid var(--gray-light)'
        }}>
          <Award size={24} style={{ color: '#facc15', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#facc15' }}>
            {users.reduce((sum, u) => sum + u.level, 0)}
          </div>
          <div style={{ color: '#666', fontSize: '0.875rem' }}>СУММА УРОВНЕЙ</div>
        </div>

        <div style={{ 
          background: 'var(--gray)', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid var(--gray-light)'
        }}>
          <TrendingUp size={24} style={{ color: '#4aff75', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4aff75' }}>
            {users.reduce((sum, u) => sum + u.total_xp, 0).toLocaleString()}
          </div>
          <div style={{ color: '#666', fontSize: '0.875rem' }}>ВСЕГО ОПЫТА</div>
        </div>

        <div style={{ 
          background: 'var(--gray)', 
          padding: '1.5rem', 
          borderRadius: '8px',
          border: '1px solid var(--gray-light)'
        }}>
          <Coins size={24} style={{ color: '#ff6b6b', marginBottom: '0.5rem' }} />
          <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b' }}>
            {users.reduce((sum, u) => sum + u.points, 0).toLocaleString()}
          </div>
          <div style={{ color: '#666', fontSize: '0.875rem' }}>ВСЕГО ПОИНТОВ</div>
        </div>
      </div>

      {/* Поиск */}
      <div style={{ marginBottom: '1.5rem', position: 'relative' }}>
        <Search 
          size={20} 
          style={{ 
            position: 'absolute', 
            left: '1rem', 
            top: '50%', 
            transform: 'translateY(-50%)',
            color: '#666'
          }} 
        />
        <input
          type="text"
          placeholder="Поиск по имени пользователя..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            width: '100%',
            padding: '0.75rem 1rem 0.75rem 3rem',
            background: 'var(--gray)',
            border: '1px solid var(--gray-light)',
            borderRadius: '8px',
            color: 'white',
            fontSize: '1rem'
          }}
        />
      </div>

      {/* Таблица пользователей */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          Загрузка...
        </div>
      ) : (
        <div style={{ 
          background: 'var(--gray)', 
          border: '1px solid var(--gray-light)',
          borderRadius: '8px',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--gray-light)' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontSize: '0.875rem', color: '#666' }}>ИГРОК</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>УРОВЕНЬ</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>ОПЫТ</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>ВСЕГО XP</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>ПОИНТЫ</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>РАНГ</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem', color: '#666' }}>ДЕЙСТВИЯ</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user, index) => (
                <tr 
                  key={user.discord_id}
                  style={{ 
                    borderTop: index > 0 ? '1px solid var(--gray-light)' : 'none'
                  }}
                >
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      {user.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={user.discord_username}
                          style={{ width: '40px', height: '40px', borderRadius: '50%' }}
                        />
                      ) : (
                        <div style={{ 
                          width: '40px', 
                          height: '40px', 
                          borderRadius: '50%',
                          background: 'var(--accent-dark)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--accent)'
                        }}>
                          {user.discord_username[0]}
                        </div>
                      )}
                      <div>
                        <div style={{ fontWeight: 'bold' }}>{user.discord_username}</div>
                        <div style={{ fontSize: '0.75rem', color: '#666' }}>ID: {user.discord_id}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ 
                      display: 'inline-block',
                      padding: '0.25rem 0.75rem',
                      background: 'linear-gradient(135deg, #4aff75 0%, #2d5a2d 100%)',
                      borderRadius: '6px',
                      fontWeight: 'bold',
                      color: '#000'
                    }}>
                      {user.level}
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.875rem' }}>
                      {user.current_xp} / {xpForLevel(user.level)}
                    </div>
                    <div style={{ 
                      width: '100px', 
                      height: '4px', 
                      background: 'var(--gray-light)',
                      borderRadius: '2px',
                      margin: '0.25rem auto',
                      overflow: 'hidden'
                    }}>
                      <div style={{ 
                        width: `${(user.current_xp / xpForLevel(user.level)) * 100}%`,
                        height: '100%',
                        background: 'var(--accent)',
                        transition: 'width 0.3s'
                      }} />
                    </div>
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: 'var(--accent)' }}>
                    {user.total_xp.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', color: '#ff6b6b' }}>
                    {user.points.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center', fontSize: '0.875rem' }}>
                    {user.forest_rank}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={() => openModal(user)}
                      className="lunacy-button"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}
                    >
                      УПРАВЛЕНИЕ
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Модальное окно */}
      {showModal && selectedUser && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'var(--gray)',
            border: '2px solid var(--accent)',
            borderRadius: '8px',
            padding: '2rem',
            maxWidth: '600px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <h2 style={{ 
              fontFamily: 'Unbounded', 
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              {selectedUser.discord_username}
            </h2>

            {/* Переключатель режимов */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '1.5rem',
              borderBottom: '1px solid var(--gray-light)',
              paddingBottom: '0.5rem'
            }}>
              <button
                onClick={() => setEditMode(false)}
                style={{
                  padding: '0.5rem 1rem',
                  background: !editMode ? 'var(--accent)' : 'transparent',
                  color: !editMode ? '#000' : 'var(--accent)',
                  border: '2px solid var(--accent)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                ДОБАВИТЬ
              </button>
              <button
                onClick={() => setEditMode(true)}
                style={{
                  padding: '0.5rem 1rem',
                  background: editMode ? 'var(--accent)' : 'transparent',
                  color: editMode ? '#000' : 'var(--accent)',
                  border: '2px solid var(--accent)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                РЕДАКТИРОВАТЬ
              </button>
            </div>

            {!editMode ? (
              /* Режим добавления */
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                    Тип
                  </label>
                  <select
                    value={transactionType}
                    onChange={(e) => setTransactionType(e.target.value as 'xp' | 'points')}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--background)',
                      border: '1px solid var(--gray-light)',
                      borderRadius: '6px',
                      color: 'white'
                    }}
                  >
                    <option value="xp">Опыт (XP)</option>
                    <option value="points">Поинты</option>
                  </select>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                    Количество
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--background)',
                      border: '1px solid var(--gray-light)',
                      borderRadius: '6px',
                      color: 'white'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                    Причина
                  </label>
                  <input
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Например: Победа в турнире"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--background)',
                      border: '1px solid var(--gray-light)',
                      borderRadius: '6px',
                      color: 'white'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleAddTransaction}
                    className="lunacy-button"
                    style={{ flex: 1 }}
                  >
                    ДОБАВИТЬ
                  </button>
                  <button
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'transparent',
                      border: '2px solid #666',
                      color: '#666',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ОТМЕНА
                  </button>
                </div>
              </>
            ) : (
              /* Режим редактирования */
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                    Уровень
                  </label>
                  <input
                    type="number"
                    value={editLevel}
                    onChange={(e) => setEditLevel(parseInt(e.target.value) || 1)}
                    min="1"
                    max="100"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--background)',
                      border: '1px solid var(--gray-light)',
                      borderRadius: '6px',
                      color: 'white'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                    Текущий XP
                  </label>
                  <input
                    type="number"
                    value={editCurrentXP}
                    onChange={(e) => setEditCurrentXP(parseInt(e.target.value) || 0)}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--background)',
                      border: '1px solid var(--gray-light)',
                      borderRadius: '6px',
                      color: 'white'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                    Всего XP
                  </label>
                  <input
                    type="number"
                    value={editTotalXP}
                    onChange={(e) => setEditTotalXP(parseInt(e.target.value) || 0)}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--background)',
                      border: '1px solid var(--gray-light)',
                      borderRadius: '6px',
                      color: 'white'
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#666' }}>
                    Поинты
                  </label>
                  <input
                    type="number"
                    value={editPoints}
                    onChange={(e) => setEditPoints(parseInt(e.target.value) || 0)}
                    min="0"
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      background: 'var(--background)',
                      border: '1px solid var(--gray-light)',
                      borderRadius: '6px',
                      color: 'white'
                    }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={handleDirectUpdate}
                    className="lunacy-button"
                    style={{ flex: 1 }}
                  >
                    СОХРАНИТЬ
                  </button>
                  <button
                    onClick={closeModal}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: 'transparent',
                      border: '2px solid #666',
                      color: '#666',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    ОТМЕНА
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
