'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Gamepad2 } from 'lucide-react'
import { Navigation, Footer, SkipToContent } from '../../components/layout'
import { ProfileHeader, ProfileEditForm, GamePreferencesSection, ProfileSkeleton, AchievementsSection } from '../../components/profile'
import { ErrorMessage } from '../../components/ui'
import { PageErrorBoundary } from '../../components/PageErrorBoundary'
import { SectionErrorBoundary } from '../../components/SectionErrorBoundary'
import { GamePreference } from '../../types/gamePreferences'
import './mobile-profile.css'

// Types
interface ProfileData {
  discord_id: number
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

// Constants
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

export default function ProfilePage() {
  const router = useRouter()
  
  // Auth state
  const [token, setToken] = useState<string | null>(null)
  
  // Profile state
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  
  // Form state
  const [siteNickname, setSiteNickname] = useState('')
  const [age, setAge] = useState<number | null>(null)
  const [bio, setBio] = useState('')
  const [isHidden, setIsHidden] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  
  // Game preferences state
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const [customGameName, setCustomGameName] = useState('')
  const [gamePreferencesChanged, setGamePreferencesChanged] = useState(false)
  
  // UI state
  const [isEditMode, setIsEditMode] = useState(false)

  // Auth check
  useEffect(() => {
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      router.push('/')
      return
    }
    setToken(storedToken)
    loadProfile(storedToken)
  }, [router])

  // Load profile data
  const loadProfile = async (authToken: string) => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await axios.get<ProfileData>(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      const data = response.data
      setProfile(data)
      setSiteNickname(data.site_nickname || '')
      setBio(data.bio || '')
      setIsHidden(data.is_hidden)
      setAvatarPreview(data.avatar_url)
      
      // Load game preferences
      await loadGamePreferences(authToken)
      
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

  // Load game preferences
  const loadGamePreferences = async (authToken: string) => {
    try {
      const response = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${authToken}` }
      })
      
      const games = new Set<string>()
      let customName = ''
      
      if (response.data && Array.isArray((response.data as any).game_preferences)) {
        (response.data as any).game_preferences.forEach((pref: GamePreference) => {
          games.add(pref.game)
          if (pref.game === 'Другое' && pref.custom_name) {
            customName = pref.custom_name
          }
        })
      }
      
      setSelectedGames(games)
      setCustomGameName(customName)
    } catch (err) {
      console.error('Error loading game preferences:', err)
    }
  }

  // Handlers
  const handleGameToggle = (game: string) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(game)) {
      newSelected.delete(game)
      if (game === 'Другое') {
        setCustomGameName('')
      }
    } else {
      newSelected.add(game)
    }
    setSelectedGames(newSelected)
    setGamePreferencesChanged(true)
  }

  const handleAvatarFileChange = (file: File | null) => {
    if (!file) return

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

      // Validate custom game name
      if (selectedGames.has('Другое') && !customGameName.trim()) {
        setError('Введите название игры для "Другое"')
        setSaving(false)
        return
      }

      // Upload avatar if selected
      let uploadedAvatarUrl = ''
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

        uploadedAvatarUrl = uploadResponse.data.avatar_url
      }

      // Update profile
      const updateData = {
        site_nickname: siteNickname.trim() || null,
        avatar_url: uploadedAvatarUrl || undefined,
        bio: bio.trim() || null,
        is_hidden: isHidden
      }

      const response = await axios.put<ProfileData>(
        `${API_URL}/api/profile`,
        updateData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      setProfile(response.data)
      setAvatarFile(null)

      // Save game preferences
      if (gamePreferencesChanged || selectedGames.size > 0) {
        const preferences: GamePreference[] = Array.from(selectedGames).map(game => ({
          game,
          custom_name: game === 'Другое' ? customGameName.trim() : null
        }))

        await axios.put(
          `${API_URL}/api/users/game-preferences`,
          { preferences },
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )
        setGamePreferencesChanged(false)
      }

      setSuccess('Профиль и игровые предпочтения успешно обновлены!')
      setIsEditMode(false)

      setTimeout(() => setSuccess(null), 3000)

    } catch (err) {
      console.error('Error saving profile:', err)
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail
        let errorMessage = 'Не удалось сохранить профиль'
        
        if (typeof detail === 'string') {
          errorMessage = detail
        } else if (Array.isArray(detail)) {
          errorMessage = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
        }
        
        setError(errorMessage)
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

  const handleRetry = () => {
    if (token) {
      loadProfile(token)
    }
  }

  // Loading state
  if (loading) {
    return (
      <>
        <SkipToContent />
        <Navigation
          isAuthenticated={!!token}
          onLogout={handleLogout}
          apiUrl={API_URL}
        />
        <main id="main-content" className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }} tabIndex={-1}>
          <ProfileSkeleton />
        </main>
      </>
    )
  }

  // Error state
  if (error || !profile) {
    return (
      <>
        <SkipToContent />
        <Navigation
          isAuthenticated={!!token}
          onLogout={handleLogout}
          apiUrl={API_URL}
        />
        <main id="main-content" className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }} tabIndex={-1}>
          <ErrorMessage
            title="Ошибка загрузки профиля"
            message={error || 'Не удалось загрузить данные профиля'}
            onRetry={handleRetry}
          />
        </main>
      </>
    )
  }

  // Main render
  return (
    <PageErrorBoundary pageName="Профиль">
      <SkipToContent />
      <Navigation
        isAuthenticated={!!token}
        onLogout={handleLogout}
        apiUrl={API_URL}
      />

      <main id="main-content" className="container" style={{ paddingTop: '2rem', paddingBottom: '4rem' }} tabIndex={-1}>
        {/* Error message */}
        {error && (
          <div style={{ 
            background: '#ff4444', 
            color: 'white', 
            padding: '1rem', 
            marginBottom: '2rem',
            border: '2px solid #ff6b6b',
            borderRadius: '8px'
          }}>
            {error}
          </div>
        )}

        {/* Success message */}
        {success && (
          <div style={{ 
            background: 'var(--accent-dark)', 
            color: 'var(--accent)', 
            padding: '1rem', 
            marginBottom: '2rem',
            border: '2px solid var(--accent)',
            borderRadius: '8px'
          }}>
            {success}
          </div>
        )}

        {/* Profile Header */}
        <SectionErrorBoundary sectionName="Заголовок профиля">
          <ProfileHeader
            nickname={profile.site_nickname}
            username={profile.discord_username}
            avatarUrl={avatarPreview || profile.avatar_url}
            bio={profile.bio}
            age={age}
            isEditMode={isEditMode}
            onToggleEdit={() => setIsEditMode(!isEditMode)}
          />
        </SectionErrorBoundary>

        {/* Edit Form */}
        {isEditMode && (
          <SectionErrorBoundary sectionName="Форма редактирования">
            <div>
              <ProfileEditForm
                siteNickname={siteNickname}
                age={age}
                bio={bio}
                isHidden={isHidden}
                saving={saving}
                onSiteNicknameChange={setSiteNickname}
                onAgeChange={setAge}
                onBioChange={setBio}
                onIsHiddenChange={setIsHidden}
                onAvatarFileChange={handleAvatarFileChange}
                onSave={handleSave}
                placeholderUsername={profile.discord_username}
              />

              {/* Game Preferences inside edit form */}
              <div style={{
                background: 'var(--gray)',
                border: '2px solid var(--accent)',
                borderRadius: '8px',
                padding: '2rem',
                marginBottom: '2rem',
                marginTop: '-1rem'
              }}>
                <GamePreferencesSection
                  selectedGames={selectedGames}
                  customGameName={customGameName}
                  onGameToggle={handleGameToggle}
                  onCustomGameNameChange={(name) => {
                    setCustomGameName(name)
                    setGamePreferencesChanged(true)
                  }}
                />
              </div>
            </div>
          </SectionErrorBoundary>
        )}

        {/* Achievements Section */}
        <SectionErrorBoundary sectionName="Достижения">
          <AchievementsSection discordId={profile.discord_id} />
        </SectionErrorBoundary>

        {/* Activity Section */}
        <SectionErrorBoundary sectionName="Активность">
          <div style={{
            background: 'var(--gray)',
            border: '2px solid var(--gray-light)',
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
            minHeight: '300px'
          }}>
            <h3 style={{ fontFamily: 'Unbounded', marginBottom: '1.5rem' }}>
              АКТИВНОСТЬ НА САЙТЕ
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '200px',
              color: '#666',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '3rem' }}>📊</div>
              <div>Лайкнутые новости, посты и активность</div>
              <div style={{ fontSize: '0.875rem' }}>(В разработке)</div>
            </div>
          </div>
        </SectionErrorBoundary>

        {/* Games Section */}
        <SectionErrorBoundary sectionName="Игры">
          <div style={{
            background: 'var(--gray)',
            border: '2px solid var(--gray-light)',
            borderRadius: '8px',
            padding: '2rem',
            marginBottom: '2rem',
            minHeight: '300px'
          }}>
            <h3 style={{ 
              fontFamily: 'Unbounded', 
              marginBottom: '1.5rem', 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem' 
            }}>
              <Gamepad2 size={24} style={{ color: 'var(--accent)' }} />
              ИГРЫ, РЕЙТИНГ И ЛЮБИМЫЕ ГЕРОИ
            </h3>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              minHeight: '200px',
              color: '#666',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{ fontSize: '3rem' }}>🎮</div>
              <div>Рейтинг в играх и любимые герои</div>
              <div style={{ fontSize: '0.875rem' }}>(В разработке)</div>
            </div>
          </div>
        </SectionErrorBoundary>

        <Footer />
      </main>
    </PageErrorBoundary>
  )
}
