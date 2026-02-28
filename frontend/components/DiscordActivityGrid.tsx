/**
 * DiscordActivityGrid - сетка карточек активности Discord
 * Отображает список пользователей с их активностью в адаптивной сетке
 * Получает данные через WebSocket и обновляет их в реальном времени
 */
import React, { useState, useEffect } from 'react'
import { DiscordActivityCard } from './DiscordActivityCard'
import { useWebSocket, DiscordUpdate, ActivityData } from '../hooks/useWebSocket'
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator'

export function DiscordActivityGrid() {
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [, setUpdateTrigger] = useState(0)
  
  // Обработка WebSocket сообщений
  const handleMessage = (update: DiscordUpdate) => {
    if (update.type === 'initial_state') {
      // Получаем начальное состояние при подключении
      setActivities(update.data?.activity || [])
    } else if (update.type === 'activity_update') {
      // Обновление конкретного пользователя
      const userId = update.data?.user_id
      if (userId) {
        setActivities(prev => {
          const index = prev.findIndex(a => a.user_id === userId)
          if (index >= 0) {
            // Обновляем существующего пользователя
            const updated = [...prev]
            updated[index] = { ...updated[index], ...update.data }
            return updated
          } else {
            // Добавляем нового пользователя
            return [...prev, update.data as ActivityData]
          }
        })
      }
    }
  }
  
  // Подключение к WebSocket
  const { status } = useWebSocket({
    url: process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws',
    token: 'public',
    onMessage: handleMessage,
    enabled: true
  })
  
  // Обновление относительного времени каждые 60 секунд
  useEffect(() => {
    const interval = setInterval(() => {
      // Триггерим ре-рендер для обновления времени во всех карточках
      setUpdateTrigger(prev => prev + 1)
    }, 60000)
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="discord-activity-section">
      <div className="section-header">
        <h2>ЧТО ПРОИСХОДИТ В DISCORD</h2>
        <ConnectionStatusIndicator status={status} />
      </div>
      
      <div className="activity-grid">
        {activities.map(activity => (
          <DiscordActivityCard
            key={activity.user_id}
            userId={activity.user_id}
            username={activity.username}
            {...(activity.avatar_url && { avatarUrl: activity.avatar_url })}
            {...(activity.game && { game: activity.game })}
            status={activity.status}
            {...(activity.roles && { roles: activity.roles })}
            {...(activity.activity_started_at && { activityStartedAt: activity.activity_started_at })}
            {...(activity.game_icon_url && { gameIconUrl: activity.game_icon_url })}
          />
        ))}
      </div>
      
      <style jsx>{`
        .discord-activity-section {
          padding: 2rem;
        }
        
        .section-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        
        .section-header h2 {
          font-family: 'Unbounded', sans-serif;
          font-size: 1.5rem;
          font-weight: 700;
          color: #4aff75;
          margin: 0;
        }
        
        .activity-grid {
          display: grid;
          gap: 1rem;
        }
        
        /* 3 колонки на больших экранах (>1024px) */
        @media (min-width: 1024px) {
          .activity-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        /* 2 колонки на средних экранах (768-1024px) */
        @media (min-width: 768px) and (max-width: 1023px) {
          .activity-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        /* 1 колонка на маленьких экранах (<768px) */
        @media (max-width: 767px) {
          .discord-activity-section {
            padding: 1rem;
          }
          
          .section-header h2 {
            font-size: 1.25rem;
          }
          
          .activity-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  )
}
