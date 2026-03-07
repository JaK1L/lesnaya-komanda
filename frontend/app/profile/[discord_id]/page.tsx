'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { TreePine, Shield } from 'lucide-react'
import { OptimizedImage } from '../../../components/ui'

interface PublicProfile {
  discord_id: number
  site_nickname: string | null
  discord_username: string
  avatar_url: string | null
  bio: string | null
  forest_rank: string
  rating: number
  joined_at: string | null
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
            <div>
              {profile.avatar_url ? (
                <OptimizedImage
                  src={profile.avatar_url}
                  alt={`${displayName} avatar`}
                  width={150}
                  height={150}
                  className="avatar"
                  priority
                  objectFit="cover"
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
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
          gap: '1rem',
          marginBottom: '2rem'
        }}>
          <div className="lunacy-card">
            <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>
              {profile.forest_rank}
            </div>
            <div style={{ color: '#666', fontSize: '0.875rem', textTransform: 'uppercase' }}>
              Ранг в лесу
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
