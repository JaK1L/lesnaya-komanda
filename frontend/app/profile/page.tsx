'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { TreePine, Upload, Loader2 } from 'lucide-react'
import './mobile-profile.css'

interface ProfileData {
  site_nickname: string | null
  discord_username: string
  avatar_url: string | null
  bio: string | null
  is_hidden: boolean
  forest_rank: string
  rating: number
  joined_at: string | null
  is_admin: boolean
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

export default function ProfilePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  
  // Form state
  const [siteNickname, setSiteNickname] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [bio, setBio] = useState('')
  const [isHidden, setIsHidden] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      router.push('/')
      return
    }
    setToken(storedToken)
    loadProfile(storedToken)
  }, [router])

  const loadProfile = async (authToken: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get<ProfileData>(`${API_URL}/api/profile`, {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      })
      
      const data = response.data
      setProfile(data)
      setSiteNickname(data.site_nickname || '')
      setAvatarUrl(data.avatar_url || '')
      setBio(data.bio || '')
      setIsHidden(data.is_hidden)
      setAvatarPreview(data.avatar_url)
      
    } catch (err) {
      console.error('Error loading profile:', err)
      if (axios.isAxiosError(err) && err.response?.status === 401) {
        localStorage.removeItem(TOKEN_KEY)
        router.push('/')
      } else {
        setError('Не удалось загрузить профиль')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleAvatarFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Check file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('Размер файла не должен превышать 5MB')
      return
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!validTypes.includes(file.type)) {
      setError('Поддерживаются только форматы: JPEG, PNG, GIF, WebP')
      return
    }

    setAvatarFile(file)
    
    // Create preview
    const reader = new FileReader()
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!token) return

    try {
      setSaving(true)
      setError(null)
      setSuccess(null)

      // Upload avatar file if selected
      if (avatarFile) {
        const formData = new FormData()
        formData.append('file', avatarFile)

        const uploadResponse = await axios.post(
          `${API_URL}/api/profile/avatar`,
          formData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data'
            }
          }
        )

        // Update avatar URL with uploaded file path
        setAvatarUrl(uploadResponse.data.avatar_url)
      }

      // Update profile data
      const updateData = {
        site_nickname: siteNickname.trim() || null,
        avatar_url: avatarFile ? undefined : (avatarUrl.trim() || null),
        bio: bio.trim() || null,
        is_hidden: isHidden
      }

      const response = await axios.put<ProfileData>(
        `${API_URL}/api/profile`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      setProfile(response.data)
      setSuccess('Профиль успешно обновлен!')
      setAvatarFile(null)

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      console.error('Error saving profile:', err)
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail || 'Не удалось сохранить профиль')
      } else {
        setError('Не удалось сохранить профиль')
      }
    } finally {
      setSaving(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem(TOKEN_KEY)
    router.push('/')
  }

  if (loading) {
    return (
      <>
        <nav className="nav">
          <div className="container nav-container">
            <a href="/" className="nav-logo">
              <TreePine size={32} />
              <span>ЛЕСНАЯ КОМАНДА</span>
            </a>
          </div>
        </nav>
        <main className="container">
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
            <Loader2 size={48} className="animate-spin" style={{ color: 'var(--accent)' }} />
          </div>
        </main>
      </>
    )
  }

  if (!profile) {
    return (
      <>
        <nav className="nav">
          <div className="container nav-container">
            <a href="/" className="nav-logo">
              <TreePine size={32} />
              <span>ЛЕСНАЯ КОМАНДА</span>
            </a>
          </div>
        </nav>
        <main className="container">
          <div className="hero-block">
            <h2>ПРОФИЛЬ НЕ НАЙДЕН</h2>
            <p>Не удалось загрузить данные профиля</p>
          </div>
        </main>
      </>
    )
  }

  const bioLength = bio.length
  const bioMaxLength = 500

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
            <button 
              type="button" 
              onClick={handleLogout} 
              className="lunacy-button" 
              style={{ padding: '0.75rem 1.5rem' }}
            >
              ВЫЙТИ
            </button>
          </div>
        </div>
      </nav>

      <main className="container">
        <div className="hero-block">
          <h1>ПРОФИЛЬ</h1>
          <p>Управляйте своими данными на сайте</p>
        </div>

        {/* Messages */}
        {error && (
          <div style={{ 
            background: '#ff4444', 
            color: 'white', 
            padding: '1rem', 
            marginBottom: '2rem',
            border: '2px solid #ff6b6b'
          }}>
            {error}
          </div>
        )}

        {success && (
          <div style={{ 
            background: 'var(--accent-dark)', 
            color: 'var(--accent)', 
            padding: '1rem', 
            marginBottom: '2rem',
            border: '2px solid var(--accent)'
          }}>
            {success}
          </div>
        )}

        {/* Profile Info */}
        <div style={{ marginBottom: '3rem' }}>
          <div className="stat-grid" style={{ marginBottom: '2rem' }}>
            <div className="stat-item">
              <div className="stat-label">DISCORD</div>
              <div className="stat-number" style={{ fontSize: '1.5rem' }}>{profile.discord_username}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">РАНГ</div>
              <div className="stat-number" style={{ fontSize: '1.5rem' }}>{profile.forest_rank}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">РЕЙТИНГ</div>
              <div className="stat-number" style={{ fontSize: '1.5rem' }}>{profile.rating}</div>
            </div>
          </div>
        </div>

        {/* Admin Panel */}
        {profile.is_admin && (
          <div className="lunacy-card" style={{ marginBottom: '3rem' }}>
            <h3 style={{ marginBottom: '2rem' }}>АДМИНКА</h3>
            <div style={{ display: 'grid', gap: '1rem' }}>
              <a 
                href="/admin/news" 
                className="lunacy-button" 
                style={{ textAlign: 'center', display: 'block', padding: '1rem' }}
              >
                УПРАВЛЕНИЕ НОВОСТЯМИ
              </a>
              <a 
                href="/admin/feed" 
                className="lunacy-button" 
                style={{ textAlign: 'center', display: 'block', padding: '1rem' }}
              >
                УПРАВЛЕНИЕ ЛЕНТОЙ
              </a>
              <a 
                href="/admin/events" 
                className="lunacy-button" 
                style={{ textAlign: 'center', display: 'block', padding: '1rem' }}
              >
                УПРАВЛЕНИЕ СОБЫТИЯМИ
              </a>
              <a 
                href="/admin/settings" 
                className="lunacy-button" 
                style={{ textAlign: 'center', display: 'block', padding: '1rem' }}
              >
                НАСТРОЙКИ
              </a>
            </div>
          </div>
        )}

        {/* Profile Form */}
        <div className="lunacy-card" style={{ marginBottom: '3rem' }}>
          <h3 style={{ marginBottom: '2rem' }}>РЕДАКТИРОВАТЬ ПРОФИЛЬ</h3>

          {/* Site Nickname */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontFamily: 'Unbounded',
              fontSize: '0.875rem',
              color: 'var(--accent)'
            }}>
              НИКНЕЙМ НА САЙТЕ
            </label>
            <input
              type="text"
              value={siteNickname}
              onChange={(e) => setSiteNickname(e.target.value)}
              maxLength={50}
              placeholder={profile.discord_username}
              style={{
                width: '100%',
                background: 'var(--gray)',
                border: '2px solid var(--gray-light)',
                color: 'white',
                padding: '1rem',
                fontSize: '1rem',
                fontFamily: 'Inter',
                outline: 'none'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gray-light)'}
            />
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
              Оставьте пустым, чтобы использовать Discord никнейм
            </div>
          </div>

          {/* Avatar */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontFamily: 'Unbounded',
              fontSize: '0.875rem',
              color: 'var(--accent)'
            }}>
              АВАТАР
            </label>
            
            {/* Avatar Preview */}
            {avatarPreview && (
              <div style={{ marginBottom: '1rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={avatarPreview} 
                  alt="Avatar preview" 
                  style={{ 
                    width: '120px', 
                    height: '120px', 
                    objectFit: 'cover', 
                    borderRadius: '50%',
                    border: '2px solid var(--accent)'
                  }} 
                />
              </div>
            )}

            {/* File Upload */}
            <div style={{ marginBottom: '1rem' }}>
              <label 
                htmlFor="avatar-upload"
                className="lunacy-button"
                style={{ 
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '0.5rem',
                  cursor: 'pointer',
                  padding: '0.75rem 1.5rem'
                }}
              >
                <Upload size={16} />
                ЗАГРУЗИТЬ ФАЙЛ
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarFileChange}
                style={{ display: 'none' }}
              />
              <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem' }}>
                JPEG, PNG, GIF, WebP • Максимум 5MB
              </div>
            </div>

            {/* Avatar URL */}
            <div>
              <div style={{ fontSize: '0.875rem', color: '#888', marginBottom: '0.5rem' }}>
                Или укажите URL:
              </div>
              <input
                type="url"
                value={avatarUrl}
                onChange={(e) => setAvatarUrl(e.target.value)}
                placeholder="https://example.com/avatar.jpg"
                style={{
                  width: '100%',
                  background: 'var(--gray)',
                  border: '2px solid var(--gray-light)',
                  color: 'white',
                  padding: '1rem',
                  fontSize: '1rem',
                  fontFamily: 'Inter',
                  outline: 'none'
                }}
                onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
                onBlur={(e) => e.target.style.borderColor = 'var(--gray-light)'}
              />
            </div>
          </div>

          {/* Bio */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'block', 
              marginBottom: '0.5rem', 
              fontFamily: 'Unbounded',
              fontSize: '0.875rem',
              color: 'var(--accent)'
            }}>
              О СЕБЕ
            </label>
            <textarea
              value={bio}
              onChange={(e) => {
                if (e.target.value.length <= bioMaxLength) {
                  setBio(e.target.value)
                }
              }}
              maxLength={bioMaxLength}
              rows={5}
              placeholder="Расскажите о себе..."
              style={{
                width: '100%',
                background: 'var(--gray)',
                border: '2px solid var(--gray-light)',
                color: 'white',
                padding: '1rem',
                fontSize: '1rem',
                fontFamily: 'Inter',
                outline: 'none',
                resize: 'vertical'
              }}
              onFocus={(e) => e.target.style.borderColor = 'var(--accent)'}
              onBlur={(e) => e.target.style.borderColor = 'var(--gray-light)'}
            />
            <div style={{ 
              fontSize: '0.75rem', 
              color: bioLength > 450 ? '#ff6b6b' : '#666', 
              marginTop: '0.5rem' 
            }}>
              {bioLength} / {bioMaxLength} символов
            </div>
          </div>

          {/* Visibility Toggle */}
          <div style={{ marginBottom: '2rem' }}>
            <label style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '1rem',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={isHidden}
                onChange={(e) => setIsHidden(e.target.checked)}
                style={{
                  width: '24px',
                  height: '24px',
                  cursor: 'pointer',
                  accentColor: 'var(--accent)'
                }}
              />
              <span style={{ fontSize: '1rem' }}>
                Скрыть профиль из публичных списков
              </span>
            </label>
            <div style={{ fontSize: '0.75rem', color: '#666', marginTop: '0.5rem', marginLeft: '2.5rem' }}>
              Ваш профиль останется доступен по прямой ссылке
            </div>
          </div>

          {/* Save Button */}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="lunacy-button"
            style={{ 
              padding: '1rem 2.5rem',
              opacity: saving ? 0.5 : 1,
              cursor: saving ? 'not-allowed' : 'pointer'
            }}
          >
            {saving ? (
              <>
                <Loader2 size={16} className="animate-spin" style={{ display: 'inline', marginRight: '0.5rem' }} />
                СОХРАНЕНИЕ...
              </>
            ) : (
              'СОХРАНИТЬ'
            )}
          </button>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>© 2026 ЛЕСНАЯ КОМАНДА. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</p>
        </footer>
      </main>
    </>
  )
}
