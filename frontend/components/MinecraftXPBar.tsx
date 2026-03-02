'use client'

import { useState, useEffect } from 'react'

interface MinecraftXPBarProps {
  currentXP?: number
  maxXP?: number
  level?: number
}

export function MinecraftXPBar({ 
  currentXP = 350, 
  maxXP = 1000, 
  level = 5 
}: MinecraftXPBarProps) {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
  }, [])

  const xpPercentage = Math.min(100, Math.max(0, (currentXP / maxXP) * 100))

  if (!mounted) return null

  return (
    <div className="minecraft-xp-bar">
      {/* Уровень */}
      <div className="minecraft-xp-level">
        {level}
      </div>
      
      {/* Полоска опыта */}
      <div className="minecraft-xp-container">
        <div 
          className="minecraft-xp-fill"
          style={{ height: `${xpPercentage}%` }}
        />
        
        {/* Деления как в Minecraft */}
        <div className="minecraft-xp-segments">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="minecraft-xp-segment" />
          ))}
        </div>
      </div>
      
      {/* Текст с опытом */}
      <div className="minecraft-xp-text">
        {currentXP}/{maxXP}
      </div>
    </div>
  )
}
