'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { TreePine, Shield, Award, TrendingUp } from 'lucide-react'

interface PublicProfile {
  discord_id: number
  site_nickname: string | null
  discord_username: string
  avatar_url: string | null
  bio: string | null
  forest_rank: string
  rating: number
  joined_at: string | null
  level: number
  current_xp: number
  total_xp: number
  points: number
  is_hidden: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function PublicProfilePage() {
  const params = useParams()
  const router = useRouter()
  const discord_id = params?.discord_id as string
  
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (discord_id) {
      loadProfile()
    }
  }, [discord_id])

  const loadProfile = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<PublicProfile>(
        `${API_URL}/api/profile/public/${discord_id}`
      )
      setProfile(response.data)
    } catch (err: any) {
      console.error('Error loading profile:', err)
      if (err.response?.status === 404) {
        setError('Профиль не найден')
      } else if (err.response?.status === 403) {
        setError('Этот профиль скрыт от публичного просмотра')
      } else {
        setError('Не удалось загрузить профиль')
      }
    } finally {
      setLoading(false)
    }
  }

  const xpForLevel = (level: number) => level * 100
  const xpProgress = profile ? (profile.current_xp / xpForLevel(profile.level)) * 100 : 0

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <TreePine size={48} style={{ color: 'var(--accent)', marginBottom: '1rem' }} />
          <p style={{ color: '#666' }}>Загрузка профиля...</p>
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', maxWidth: '500px', padding: '2rem' }}>
          <Shield size={64} style={{ color: '#666', marginBottom: '1rem' }} />
          <h1 style={{ fontFamily: 'Unbounded', fontSize: '2rem', marginBottom: '1rem' }}>
            {error || 'ПРОФИЛЬ НЕ НАЙДЕН'}
          </h1>
          <p style={{ color: '#666', marginBottom: '2rem' }}>
            {error === 'Этот профиль скрыт от публичного просмотра' 
              ? 'Пользователь скрыл свой профиль от других участников леса.'
              : 'Возможно, пользователь еще не зарегистрирован в системе.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="lunacy-button"
          >
            ВЕРНУТЬСЯ НА ГЛАВНУЮ
          </button>
        </div>
      </div>
    )
  }

  const displayName = profile.site_nickname || profile.discord_username

  return (
    <>
      {/* Навигация */}
      <nav className="nav">
        <div className="container nav-container">
          <a href="/" className="nav-logo">
            <TreePine size={32} />
            <span>ЛЕСНАЯ КОМАНДА</span>
          </a>
          <div className="nav-links">
            <a href="/" className="nav-link">ГЛАВНАЯ</a>
            <a href="/profile" className="nav-link">МОЙ ПРОФИЛЬ</a>
          </div>
        </div>
      </nav>

      <main className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }}>
        {/* Шапка профиля */}
        <div className="lunacy-card" style={{ marginBottom: '2rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '2rem', flexWrap: 'wrap' }}>
            {/* Аватар */}
            <div style={{ position: 'relative' }}>
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={displayName}
                  style={{
                    width: '150px',
                    height: '150px',
                    borderRadius: '50%',
                    border: '4px solid var(--accent)',
                    objectFit: 'cover'
                  }}
                />
              ) : (
                <div style={{
                  width: '150px',
                  height: '150px',
                  borderRadius: '50%',
                  border: '4px solid var(--accent)',
                  background: 'var(--accent-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '4rem',
                  color: 'var(--accent)'
                }}>
                  {displayName[0].toUpperCase()}
                </div>
              )}
              
              {/* Уровень бейдж */}
              <div style={{
                position: 'absolute',
                bottom: '-10px',
                right: '-10px',
                background: 'linear-gradient(135deg, #4aff75 0%, #2d5a2d 100%)',
                color: '#000',
                fontWeight: 900,
                fontSize: '1.5rem',
                width: '60px',
                height: '60px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '4px solid var(--background)',
                boxShadow: '0 4px 12px rgba(74, 255, 117, 0.3)'
              }}>
                {profile.level}
              </div>
            </div>

            {/* Информация */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <h1 style={{ 
                fontFamily: 'Unbounded', 
                fontSize: '2.5rem', 
                marginBottom: '0.5rem',
                wordBreak: 'break-word'
              }}>
                {displayName}
              </h1>
              
              {profile.site_nickname && (
                <p style={{ color: '#666', marginBottom: '0.5rem' }}>
                  Discord: {profile.discord_username}
                </p>
              )}

              <div style={{ 
                display: 'inline-block',
                padding: '0.5rem 1rem',
                background: 'var(--gray)',
                border: '2px solid var(--accent)',
                borderRadius: '6px',
                marginBottom: '1rem'
              }}>
                <span style={{ fontSize: '1.5rem' }}>{profile.forest_rank}</span>
              </div>

              {profile.bio && (
                <p style={{ 
                  color: '#ccc', 
                  lineHeight: '1.6',
                  marginTop: '1rem',
                  whiteSpace: 'pre-wrap'
                }}>
                  {profile.bio}
                </p>
              )}

              {profile.joined_at && (
                <p style={{ color: '#666', marginTop: '1rem', fontSize: '0.875rem' }}>
                  В лесу с {new Date(profile.joined_at).toLocaleDateString('ru-RU', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Статистика */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="lunacy-card">
            <Award size={32} style={{ color: 'var(--accent)', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: 'var(--accent)' }}>
              {profile.level}
            </div>
            <div style={{ color: '#666', fontSize: '0.875rem', textTransform: 'uppercase' }}>
              Уровень
            </div>
          </div>

          <div className="lunacy-card">
            <TrendingUp size={32} style={{ color: '#4aff75', marginBottom: '0.5rem' }} />
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#4aff75' }}>
              {profile.total_xp.toLocaleString()}
            </div>
            <div style={{ color: '#666', fontSize: '0.875rem', textTransform: 'uppercase' }}>
              Всего опыта
            </div>
          </div>

          <div className="lunacy-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🪙</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#ff6b6b' }}>
              {profile.points.toLocaleString()}
            </div>
            <div style={{ color: '#666', fontSize: '0.875rem', textTransform: 'uppercase' }}>
              Поинтов
            </div>
          </div>

          <div className="lunacy-card">
            <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⭐</div>
            <div style={{ fontSize: '2rem', fontWeight: 'bold', color: '#facc15' }}>
              {profile.rating}
            </div>
            <div style={{ color: '#666', fontSize: '0.875rem', textTransform: 'uppercase' }}>
              Рейтинг
            </div>
          </div>
        </div>

        {/* Прогресс опыта */}
        <div className="lunacy-card">
          <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={24} />
            ПРОГРЕСС ДО СЛЕДУЮЩЕГО УРОВНЯ
          </h3>
          
          <div style={{ marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#666' }}>Уровень {profile.level}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 'bold' }}>
              {profile.current_xp} / {xpForLevel(profile.level)} XP
            </span>
          </div>

          <div style={{ 
            width: '100%', 
            height: '20px', 
            background: 'var(--gray-light)',
            borderRadius: '10px',
            overflow: 'hidden',
            position: 'relative'
          }}>
            <div style={{ 
              width: `${xpProgress}%`,
              height: '100%',
              background: 'linear-gradient(to right, #4aff75, #5fff88)',
              transition: 'width 0.5s ease',
              boxShadow: '0 0 20px rgba(74, 255, 117, 0.5)'
            }} />
          </div>

          <div style={{ marginTop: '0.5rem', textAlign: 'center', color: '#666', fontSize: '0.875rem' }}>
            {Math.round(xpProgress)}% до уровня {profile.level + 1}
          </div>
        </div>

        {/* Кнопка поделиться */}
        <div style={{ marginTop: '2rem', textAlign: 'center' }}>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href)
              alert('Ссылка на профиль скопирована!')
            }}
            className="lunacy-button"
          >
            ПОДЕЛИТЬСЯ ПРОФИЛЕМ
          </button>
        </div>
      </main>

      {/* Футер */}
      <footer className="footer">
        <p>© 2026 ЛЕСНАЯ КОМАНДА. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</p>
        <p style={{ marginTop: '0.5rem' }}>СДЕЛАНО С 🌲 В ЛЕСУ</p>
      </footer>
    </>
  )
}
