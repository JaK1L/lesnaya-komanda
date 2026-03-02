/**
 * DiscordActivityGrid - сетка карточек активности Discord
 * Отображает список пользователей с их активностью в адаптивной сетке
 * Получает данные через WebSocket и обновляет их в реальном времени
 */
import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { DiscordActivityCard } from './DiscordActivityCard'
import { useWebSocket, DiscordUpdate, ActivityData } from '../hooks/useWebSocket'
import { ConnectionStatusIndicator } from './ConnectionStatusIndicator'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/discord'

export function DiscordActivityGrid() {
  const [activities, setActivities] = useState<ActivityData[]>([])
  const [, setUpdateTrigger] = useState(0)
  const [loading, setLoading] = useState(true)
  const [openModalUserId, setOpenModalUserId] = useState<string | null>(null)
  
  // Fallback: загрузка данных через REST API
  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const response = await axios.get<ActivityData[]>(`${API_URL}/api/discord/presence`)
        setActivities(response.data)
        setLoading(false)
      } catch (error) {
        console.error('[DiscordActivityGrid] Failed to fetch activities:', error)
        setLoading(false)
      }
    }
    
    // Загружаем данные сразу
    fetchActivities()
    
    // Обновляем каждые 10 секунд как fallback
    const interval = setInterval(fetchActivities, 10000)
    
    return () => clearInterval(interval)
  }, [])
  
  // Обработка WebSocket сообщений
  const handleMessage = (update: DiscordUpdate) => {
    if (update.type === 'initial_state') {
      // Получаем начальное состояние при подключении
      setActivities(update.data?.activity || [])
      setLoading(false)
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
  
  // Подключение к WebSocket (опционально)
  const { status } = useWebSocket({
    url: WS_URL,
    token: 'public',
    onMessage: handleMessage,
    enabled: !!process.env.NEXT_PUBLIC_WS_URL  // Включаем только если URL настроен
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
        {process.env.NEXT_PUBLIC_WS_URL && <ConnectionStatusIndicator status={status} />}
      </div>
      
      {loading ? (
        <div className="loading-message">Загрузка...</div>
      ) : activities.length === 0 ? (
        <div className="empty-message">
          <p>Пока никто не играет</p>
          <p style={{ fontSize: '0.875rem', color: '#666', marginTop: '0.5rem' }}>
            Как только кто-то из участников Discord начнет играть, здесь появится информация
          </p>
        </div>
      ) : (
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
              {...(activity.custom_status && { customStatus: activity.custom_status })}
              {...(activity.bio && { bio: activity.bio })}
              {...(activity.created_at && { createdAt: activity.created_at })}
              {...(activity.joined_at && { joinedAt: activity.joined_at })}
              isModalOpen={openModalUserId === activity.user_id}
              onOpenModal={() => setOpenModalUserId(activity.user_id)}
              onCloseModal={() => setOpenModalUserId(null)}
            />
          ))}
        </div>
      )}
      
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
        
        .loading-message,
        .empty-message {
          text-align: center;
          padding: 3rem 2rem;
          color: #b9bbbe;
          font-size: 1rem;
        }
        
        .empty-message p {
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
