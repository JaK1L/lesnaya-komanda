/**
 * ConnectionStatusIndicator - индикатор статуса WebSocket соединения
 */
import React from 'react'
import { ConnectionStatus } from '../hooks/useWebSocket'

interface ConnectionStatusIndicatorProps {
  status: ConnectionStatus
}

export function ConnectionStatusIndicator({ status }: ConnectionStatusIndicatorProps) {
  // Определяем цвет и иконку в зависимости от статуса
  const getStatusConfig = () => {
    switch (status) {
      case 'connected':
        return {
          color: '#4aff75',  // зеленый
          icon: '●',
          text: 'LIVE'
        }
      case 'reconnecting':
        return {
          color: '#facc15',  // желтый
          icon: '◐',
          text: 'ПЕРЕПОДКЛЮЧЕНИЕ'
        }
      case 'disconnected':
        return {
          color: '#ff6b6b',  // красный
          icon: '○',
          text: 'OFFLINE'
        }
    }
  }
  
  const config = getStatusConfig()
  
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.25rem 0.75rem',
        borderRadius: '4px',
        background: 'rgba(0, 0, 0, 0.3)',
        fontSize: '0.75rem',
        fontFamily: 'Unbounded, sans-serif',
        fontWeight: 600,
        color: config.color,
        border: `1px solid ${config.color}40`,
      }}
    >
      <span
        style={{
          fontSize: '1rem',
          lineHeight: 1,
          animation: status === 'reconnecting' ? 'pulse 1.5s ease-in-out infinite' : 'none',
        }}
      >
        {config.icon}
      </span>
      <span>{config.text}</span>
      
      <style jsx>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.3;
          }
        }
      `}</style>
    </div>
  )
}
