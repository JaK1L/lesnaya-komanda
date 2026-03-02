/**
 * DiscordActivityCard - карточка активности пользователя Discord
 * Отображает аватар, никнейм, статус, роли, игровую активность и относительное время
 * Кликабельная карточка с модальным мини-профилем
 */
import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import { Role } from '../hooks/useWebSocket'

interface DiscordActivityCardProps {
  userId: string
  username: string
  avatarUrl?: string
  game?: string
  status: 'online' | 'offline' | 'idle' | 'dnd'
  roles?: Role[]
  activityStartedAt?: string
  gameIconUrl?: string
}

export const DiscordActivityCard = React.memo(function DiscordActivityCard({
  userId: _userId,
  username,
  avatarUrl,
  game,
  status,
  roles = [],
  activityStartedAt,
  gameIconUrl
}: DiscordActivityCardProps) {
  const [showModal, setShowModal] = useState(false)
  
  // Вычисление относительного времени
  const relativeTime = useMemo(() => {
    if (!activityStartedAt) return 'Сейчас'
    
    const start = new Date(activityStartedAt)
    const now = new Date()
    const diffMs = now.getTime() - start.getTime()
    const diffMinutes = Math.floor(diffMs / 60000)
    
    if (diffMinutes < 60) {
      return `${diffMinutes} мин. назад`
    } else if (diffMinutes < 1440) {
      const hours = Math.floor(diffMinutes / 60)
      return `${hours} ч. назад`
    } else if (diffMinutes < 10080) {
      const days = Math.floor(diffMinutes / 1440)
      return `${days} д. назад`
    } else {
      const weeks = Math.floor(diffMinutes / 10080)
      return `${weeks} нед. назад`
    }
  }, [activityStartedAt])
  
  // Цвет индикатора статуса
  const statusColor = {
    online: '#4aff75',
    offline: '#747f8d',
    idle: '#faa61a',
    dnd: '#f04747'
  }[status]
  
  // Ограничение ролей до 5
  const displayRoles = roles.slice(0, 5)
  const extraRolesCount = roles.length - 5
  
  // Статус текстом
  const statusText = {
    online: 'В сети',
    offline: 'Не в сети',
    idle: 'Нет на месте',
    dnd: 'Не беспокоить'
  }[status]
  
  return (
    <>
      <div 
        className="discord-activity-card"
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            setShowModal(true)
          }
        }}
      >
      {/* Аватар с индикатором статуса */}
      <div className="avatar-container">
        <Image
          src={avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
          alt={username}
          width={64}
          height={64}
          className="avatar"
        />
        <div 
          className="status-indicator"
          style={{ backgroundColor: statusColor }}
        />
      </div>
      
      {/* Информация о пользователе */}
      <div className="user-info">
        <h3 className="username">{username}</h3>
        
        {/* Роли */}
        {displayRoles.length > 0 && (
          <div className="roles">
            {displayRoles.map((role, idx) => (
              <span
                key={idx}
                className="role-badge"
                style={{
                  backgroundColor: role.color || '#747f8d'
                }}
              >
                {role.name}
              </span>
            ))}
            {extraRolesCount > 0 && (
              <span className="role-badge extra">+{extraRolesCount}</span>
            )}
          </div>
        )}
      </div>
      
      {/* Игровая активность */}
      {game && (
        <div className="game-activity">
          {gameIconUrl ? (
            <Image
              src={gameIconUrl}
              alt={game}
              width={48}
              height={48}
              className="game-icon"
              loading="lazy"
              onError={(e) => {
                // Fallback к placeholder при ошибке загрузки
                const target = e.currentTarget as HTMLImageElement
                target.style.display = 'none'
                const placeholder = target.nextElementSibling as HTMLElement
                if (placeholder) placeholder.style.display = 'flex'
              }}
            />
          ) : null}
          <div className="game-icon-placeholder" style={{ display: gameIconUrl ? 'none' : 'flex' }}>
            🎮
          </div>
          <div className="game-info">
            <p className="game-label">Играет в</p>
            <p className="game-name">{game}</p>
            <p className="game-time">{relativeTime}</p>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .discord-activity-card {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          min-width: 280px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          cursor: pointer;
        }
        
        .discord-activity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 255, 136, 0.2);
          border-color: rgba(0, 255, 136, 0.3);
        }
        
        .discord-activity-card:focus {
          outline: 2px solid #00ff88;
          outline-offset: 2px;
        }
        
        .avatar-container {
          position: relative;
          width: 64px;
          height: 64px;
        }
        
        .avatar {
          border-radius: 50%;
          object-fit: cover;
        }
        
        .status-indicator {
          position: absolute;
          bottom: 0;
          right: 0;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 2px solid rgba(0, 0, 0, 0.4);
        }
        
        .user-info {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        
        .username {
          font-family: 'Unbounded', sans-serif;
          font-size: 1rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0;
        }
        
        .roles {
          display: flex;
          flex-wrap: wrap;
          gap: 4px;
        }
        
        .role-badge {
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 0.75rem;
          font-weight: 500;
          color: #ffffff;
          height: 20px;
          display: inline-flex;
          align-items: center;
        }
        
        .role-badge.extra {
          background-color: #747f8d;
        }
        
        .game-activity {
          display: flex;
          gap: 0.75rem;
          align-items: center;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .game-icon {
          border-radius: 8px;
          object-fit: cover;
          flex-shrink: 0;
        }
        
        .game-icon-placeholder {
          width: 48px;
          height: 48px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          flex-shrink: 0;
        }
        
        .game-info {
          flex: 1;
          min-width: 0;
        }
        
        .game-label {
          font-size: 0.6875rem;
          color: #b9bbbe;
          margin: 0 0 0.125rem 0;
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
        
        .game-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.25rem 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .game-time {
          font-size: 0.75rem;
          color: #b9bbbe;
          margin: 0;
        }
        
        @media (max-width: 768px) {
          .username {
            font-size: 0.875rem;
          }
          
          .game-name {
            font-size: 0.8125rem;
          }
        }
      `}</style>
    </div>
    
    {/* Модальное окно с мини-профилем */}
    {showModal && (
      <div 
        className="modal-overlay"
        onClick={() => setShowModal(false)}
      >
        <div 
          className="modal-content"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Баннер с аватаром */}
          <div className="profile-banner">
            <div className="profile-avatar-large">
              <Image
                src={avatarUrl || 'https://cdn.discordapp.com/embed/avatars/0.png'}
                alt={username}
                width={120}
                height={120}
                className="avatar-large"
              />
              <div 
                className="status-indicator-large"
                style={{ backgroundColor: statusColor }}
              />
            </div>
          </div>
          
          {/* Информация о профиле */}
          <div className="profile-info">
            <h2 className="profile-username">{username}</h2>
            <p className="profile-status">{statusText}</p>
            
            {/* Все роли */}
            {roles.length > 0 && (
              <div className="profile-section">
                <h3 className="section-title">Роли</h3>
                <div className="roles-list">
                  {roles.map((role, idx) => (
                    <span
                      key={idx}
                      className="role-badge-large"
                      style={{
                        backgroundColor: role.color || '#747f8d'
                      }}
                    >
                      {role.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* Игровая активность */}
            {game && (
              <div className="profile-section">
                <h3 className="section-title">Активность</h3>
                <div className="activity-details">
                  {gameIconUrl ? (
                    <Image
                      src={gameIconUrl}
                      alt={game}
                      width={60}
                      height={60}
                      className="game-icon-large"
                      loading="lazy"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement
                        target.style.display = 'none'
                        const placeholder = target.nextElementSibling as HTMLElement
                        if (placeholder) placeholder.style.display = 'flex'
                      }}
                    />
                  ) : null}
                  <div className="game-icon-placeholder-large" style={{ display: gameIconUrl ? 'none' : 'flex' }}>
                    🎮
                  </div>
                  <div>
                    <p className="activity-label">Играет в</p>
                    <p className="activity-game">{game}</p>
                    <p className="activity-time">{relativeTime}</p>
                  </div>
                </div>
              </div>
            )}
            
            <button 
              className="close-button"
              onClick={() => setShowModal(false)}
            >
              Закрыть
            </button>
          </div>
          
          <style jsx>{`
            .modal-overlay {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              bottom: 0;
              background: rgba(0, 0, 0, 0.85);
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 1000;
              padding: 1rem;
              animation: fadeIn 0.2s ease-out;
            }
            
            @keyframes fadeIn {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            
            .modal-content {
              background: #1a1a1a;
              border-radius: 16px;
              max-width: 500px;
              width: 100%;
              max-height: 90vh;
              overflow-y: auto;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
              animation: slideUp 0.3s ease-out;
            }
            
            @keyframes slideUp {
              from {
                transform: translateY(20px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
            
            .profile-banner {
              background: linear-gradient(135deg, #00ff88 0%, #00aa55 100%);
              height: 120px;
              border-radius: 16px 16px 0 0;
              position: relative;
            }
            
            .profile-avatar-large {
              position: absolute;
              bottom: -60px;
              left: 24px;
              width: 120px;
              height: 120px;
            }
            
            .avatar-large {
              border-radius: 50%;
              border: 6px solid #1a1a1a;
              object-fit: cover;
            }
            
            .status-indicator-large {
              position: absolute;
              bottom: 6px;
              right: 6px;
              width: 24px;
              height: 24px;
              border-radius: 50%;
              border: 4px solid #1a1a1a;
            }
            
            .profile-info {
              padding: 72px 24px 24px;
            }
            
            .profile-username {
              font-family: 'Unbounded', sans-serif;
              font-size: 1.5rem;
              font-weight: 700;
              color: #ffffff;
              margin: 0 0 0.5rem 0;
            }
            
            .profile-status {
              font-size: 0.875rem;
              color: #b9bbbe;
              margin: 0 0 1.5rem 0;
            }
            
            .profile-section {
              margin-bottom: 1.5rem;
            }
            
            .section-title {
              font-size: 0.75rem;
              font-weight: 700;
              color: #b9bbbe;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin: 0 0 0.75rem 0;
            }
            
            .roles-list {
              display: flex;
              flex-wrap: wrap;
              gap: 6px;
            }
            
            .role-badge-large {
              padding: 4px 12px;
              border-radius: 6px;
              font-size: 0.875rem;
              font-weight: 500;
              color: #ffffff;
              display: inline-flex;
              align-items: center;
            }
            
            .activity-details {
              display: flex;
              gap: 1rem;
              align-items: center;
            }
            
            .game-icon-large {
              border-radius: 12px;
              object-fit: cover;
              flex-shrink: 0;
            }
            
            .game-icon-placeholder-large {
              width: 60px;
              height: 60px;
              border-radius: 12px;
              background: rgba(255, 255, 255, 0.1);
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 2rem;
              flex-shrink: 0;
            }
            
            .activity-label {
              font-size: 0.75rem;
              color: #b9bbbe;
              margin: 0 0 0.25rem 0;
              text-transform: uppercase;
              font-weight: 600;
              letter-spacing: 0.5px;
            }
            
            .activity-game {
              font-size: 1rem;
              font-weight: 600;
              color: #ffffff;
              margin: 0 0 0.25rem 0;
            }
            
            .activity-time {
              font-size: 0.875rem;
              color: #b9bbbe;
              margin: 0;
            }
            
            .close-button {
              width: 100%;
              padding: 0.75rem;
              background: #00ff88;
              color: #0a0a0a;
              border: none;
              border-radius: 8px;
              font-size: 1rem;
              font-weight: 700;
              cursor: pointer;
              transition: background 0.2s;
              margin-top: 1.5rem;
            }
            
            .close-button:hover {
              background: #00dd77;
            }
            
            @media (max-width: 768px) {
              .profile-username {
                font-size: 1.25rem;
              }
              
              .profile-avatar-large {
                width: 100px;
                height: 100px;
                bottom: -50px;
              }
              
              .avatar-large {
                width: 100px !important;
                height: 100px !important;
              }
              
              .profile-info {
                padding: 62px 16px 16px;
              }
            }
          `}</style>
        </div>
      </div>
    )}
    </>
  )
})
