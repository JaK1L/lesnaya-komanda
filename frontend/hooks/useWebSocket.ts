/**
 * useWebSocket hook для подключения к WebSocket серверу Discord real-time updates
 */
import { useEffect, useRef, useState, useCallback } from 'react'

export type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

export interface Role {
  name: string
  color?: string
}

export interface ActivityData {
  user_id: string
  username: string
  avatar_url?: string
  game?: string
  status: 'online' | 'offline' | 'idle' | 'dnd'
  roles: Role[]
  activity_started_at?: string  // ISO 8601 timestamp
  game_icon_url?: string
  custom_status?: string
  bio?: string
  created_at?: string  // ISO 8601 timestamp
  joined_at?: string  // ISO 8601 timestamp
}

export interface LeaderboardEntry {
  user_id: string
  username: string
  count?: number  // для сообщений
  minutes?: number  // для голоса
}

export interface StatisticsData {
  message_leaderboard: LeaderboardEntry[]
  voice_leaderboard: LeaderboardEntry[]
}

export interface InitialStateData {
  activity: ActivityData[]
  statistics: StatisticsData
}

export interface DiscordUpdate {
  type: 'initial_state' | 'activity_update' | 'statistics_update' | 'ping' | 'batch'
  timestamp: string
  data?: any
  messages?: DiscordUpdate[]  // для batch сообщений
}

export interface UseWebSocketOptions {
  url: string
  token: string
  onMessage: (data: DiscordUpdate) => void
  onStatusChange?: (status: ConnectionStatus) => void
  enabled?: boolean  // позволяет отключить WebSocket
}

export interface UseWebSocketReturn {
  status: ConnectionStatus
  disconnect: () => void
  reconnect: () => void
}

const MAX_RECONNECT_ATTEMPTS = 5  // уменьшено с 10 до 5
const INITIAL_RECONNECT_DELAY = 2000  // увеличено с 1s до 2s
const MAX_RECONNECT_DELAY = 15000  // уменьшено с 30s до 15s

export function useWebSocket(options: UseWebSocketOptions): UseWebSocketReturn {
  const { url, token, onMessage, onStatusChange, enabled = true } = options
  
  const [status, setStatus] = useState<ConnectionStatus>('disconnected')
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectAttemptsRef = useRef(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const shouldReconnectRef = useRef(true)
  const lastMessageTimestampRef = useRef<string>('')
  
  // Обновление статуса с callback
  const updateStatus = useCallback((newStatus: ConnectionStatus) => {
    setStatus(newStatus)
    onStatusChange?.(newStatus)
  }, [onStatusChange])
  
  // Валидация сообщения
  const validateMessage = useCallback((message: DiscordUpdate): boolean => {
    // Проверка обязательных полей
    if (!message.type || !message.timestamp) {
      console.error('[WebSocket] Invalid message format: missing type or timestamp', message)
      return false
    }
    
    // Проверка типа сообщения
    const validTypes = ['initial_state', 'activity_update', 'statistics_update', 'ping', 'batch']
    if (!validTypes.includes(message.type)) {
      console.error('[WebSocket] Invalid message type:', message.type)
      return false
    }
    
    // Проверка timestamp ordering (игнорируем старые сообщения)
    if (lastMessageTimestampRef.current && message.timestamp < lastMessageTimestampRef.current) {
      console.warn('[WebSocket] Out-of-order message ignored:', message.timestamp)
      return false
    }
    
    return true
  }, [])
  
  // Обработка входящих сообщений
  const handleMessage = useCallback((event: MessageEvent) => {
    try {
      const message: DiscordUpdate = JSON.parse(event.data)
      
      // Валидация
      if (!validateMessage(message)) {
        return
      }
      
      // Обновляем последний timestamp
      lastMessageTimestampRef.current = message.timestamp
      
      // Обработка ping - отправляем pong
      if (message.type === 'ping') {
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'pong',
            timestamp: new Date().toISOString()
          }))
        }
        return
      }
      
      // Обработка batch сообщений
      if (message.type === 'batch' && message.messages) {
        message.messages.forEach(msg => {
          if (validateMessage(msg)) {
            onMessage(msg)
          }
        })
        return
      }
      
      // Обычное сообщение
      onMessage(message)
      
    } catch (error) {
      console.error('[WebSocket] Error parsing message:', error, event.data)
    }
  }, [onMessage, validateMessage])
  
  // Подключение к WebSocket
  const connect = useCallback(() => {
    if (!enabled) return
    
    try {
      // Формируем URL с токеном
      const wsUrl = `${url}?token=${encodeURIComponent(token)}`
      
      console.log('[WebSocket] Connecting to:', url)
      const ws = new WebSocket(wsUrl)
      wsRef.current = ws
      
      ws.onopen = () => {
        console.log('[WebSocket] Connected')
        updateStatus('connected')
        reconnectAttemptsRef.current = 0  // Сбрасываем счетчик попыток
      }
      
      ws.onmessage = handleMessage
      
      ws.onerror = (error) => {
        console.error('[WebSocket] Error:', error)
      }
      
      ws.onclose = () => {
        console.log('[WebSocket] Connection closed')
        updateStatus('disconnected')
        wsRef.current = null
        
        // Автоматическое переподключение
        if (shouldReconnectRef.current && reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
          const delay = Math.min(
            INITIAL_RECONNECT_DELAY * Math.pow(2, reconnectAttemptsRef.current),
            MAX_RECONNECT_DELAY
          )
          
          console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current + 1}/${MAX_RECONNECT_ATTEMPTS})`)
          updateStatus('reconnecting')
          
          reconnectTimeoutRef.current = setTimeout(() => {
            reconnectAttemptsRef.current++
            connect()
          }, delay)
        } else if (reconnectAttemptsRef.current >= MAX_RECONNECT_ATTEMPTS) {
          console.warn('[WebSocket] Max reconnection attempts reached, falling back to REST API polling')
          // TODO: Активировать REST API polling
        }
      }
      
    } catch (error) {
      console.error('[WebSocket] Connection error:', error)
      updateStatus('disconnected')
    }
  }, [url, token, enabled, handleMessage, updateStatus])
  
  // Отключение от WebSocket
  const disconnect = useCallback(() => {
    shouldReconnectRef.current = false
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }
    
    if (wsRef.current) {
      wsRef.current.close()
      wsRef.current = null
    }
    
    updateStatus('disconnected')
  }, [updateStatus])
  
  // Ручное переподключение
  const reconnect = useCallback(() => {
    disconnect()
    shouldReconnectRef.current = true
    reconnectAttemptsRef.current = 0
    connect()
  }, [connect, disconnect])
  
  // Подключение при монтировании компонента
  useEffect(() => {
    if (enabled) {
      shouldReconnectRef.current = true
      connect()
    }
    
    // Отключение при размонтировании
    return () => {
      disconnect()
    }
  }, [enabled, connect, disconnect])
  
  return {
    status,
    disconnect,
    reconnect
  }
}
