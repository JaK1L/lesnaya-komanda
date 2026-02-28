/**
 * DiscordActivityCard - карточка активности пользователя Discord
 * Отображает аватар, никнейм, статус, роли, игровую активность и относительное время
 */
import React, { useMemo } from 'react'
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
  userId,
  username,
  avatarUrl,
  game,
  status,
  roles = [],
  activityStartedAt,
  gameIconUrl
}: DiscordActivityCardProps) {
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
  
  return (
    <div className="discord-activity-card">
      {/* Аватар с индикатором статуса */}
      <div className="avatar-container">
        <Image
          src={avatarUrl || '/default-avatar.png'}
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
              width={64}
              height={64}
              className="game-icon"
              loading="lazy"
              onError={(e) => {
                // Fallback к placeholder при ошибке загрузки
                e.currentTarget.src = '/game-placeholder.png'
              }}
            />
          ) : (
            <div className="game-icon-placeholder">🎮</div>
          )}
          <div className="game-info">
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
          transition: transform 0.2s, box-shadow 0.2s;
        }
        
        .discord-activity-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 12px rgba(0, 0, 0, 0.4);
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
        }
        
        .game-icon-placeholder {
          width: 64px;
          height: 64px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.1);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 2rem;
        }
        
        .game-info {
          flex: 1;
        }
        
        .game-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: #ffffff;
          margin: 0 0 0.25rem 0;
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
  )
})
