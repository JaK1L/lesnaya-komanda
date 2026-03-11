'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import axios from 'axios'
import { Navigation, Footer, SkipToContent } from '../../components/layout'
import { GamePreferencesSection, AchievementsSection, GameAccountsSection } from '../../components/profile'
import { PageErrorBoundary } from '../../components/PageErrorBoundary'
import { SectionErrorBoundary } from '../../components/SectionErrorBoundary'
import { GamePreference } from '../../types/gamePreferences'
import styles from './page.module.css'

// Types
interface ProfileData {
  discord_id: number | null
  site_nickname: string | null
  discord_username: string
  user_tag: string | null
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
        <main id="main-content" className={styles.container} tabIndex={-1}>
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Загрузка профиля...</p>
          </div>
        </main>
        <Footer />
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
        <main id="main-content" className={styles.container} tabIndex={-1}>
          <div className={styles.section}>
            <div className={styles.sectionEmpty}>
              <div className={styles.sectionEmptyIcon}>⚠️</div>
              <h3>Ошибка загрузки профиля</h3>
              <p>{error || 'Не удалось загрузить данные профиля'}</p>
              <button onClick={handleRetry} className={styles.editButton} style={{ marginTop: '1rem' }}>
                Попробовать снова
              </button>
            </div>
          </div>
        </main>
        <Footer />
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

      <main id="main-content" className={styles.container} tabIndex={-1}>
        {/* Messages */}
        {error && (
          <div className={`${styles.message} ${styles.messageError}`}>
            {error}
          </div>
        )}

        {success && (
          <div className={`${styles.message} ${styles.messageSuccess}`}>
            {success}
          </div>
        )}

        {/* Profile Card */}
        <SectionErrorBoundary sectionName="Профиль">
          <div className={styles.profileCard}>
            <div className={styles.profileHeader}>
              <div className={styles.avatarSection}>
                <div className={styles.avatar}>
                  {avatarPreview || profile.avatar_url ? (
                    <img src={avatarPreview || profile.avatar_url || ''} alt={profile.discord_username} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {profile.discord_username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.profileInfo}>
                <h1 className={styles.profileName}>
                  {profile.site_nickname || profile.discord_username}
                </h1>
                {profile.site_nickname && (
                  <p className={styles.profileUsername}>@{profile.discord_username}</p>
                )}
                {profile.user_tag && (
                  <span className={styles.profileTag}>{profile.user_tag}</span>
                )}
                {profile.bio && !isEditMode && (
                  <p className={styles.profileBio}>{profile.bio}</p>
                )}
              </div>

              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={styles.editButton}
              >
                {isEditMode ? 'Отменить' : 'Редактировать'}
              </button>
            </div>

            {/* Edit Form */}
            {isEditMode && (
              <div className={styles.form}>
                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Никнейм на сайте</label>
                  <input
                    type="text"
                    className={styles.formInput}
                    value={siteNickname}
                    onChange={(e) => setSiteNickname(e.target.value)}
                    placeholder={profile.discord_username}
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>О себе</label>
                  <textarea
                    className={styles.formTextarea}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Расскажите о себе..."
                  />
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.formLabel}>Аватар</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleAvatarFileChange(e.target.files?.[0] || null)}
                    className={styles.formInput}
                  />
                </div>

                <div className={styles.formCheckbox}>
                  <input
                    type="checkbox"
                    id="isHidden"
                    checked={isHidden}
                    onChange={(e) => setIsHidden(e.target.checked)}
                  />
                  <label htmlFor="isHidden">Скрыть профиль от других пользователей</label>
                </div>

                <div className={styles.formActions}>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={styles.saveButton}
                  >
                    {saving ? 'Сохранение...' : 'Сохранить изменения'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </SectionErrorBoundary>

        {/* Game Preferences */}
        {isEditMode && (
          <SectionErrorBoundary sectionName="Игровые предпочтения">
            <div className={styles.section}>
              <h2 className={styles.sectionTitle}>Игровые предпочтения</h2>
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
          </SectionErrorBoundary>
        )}

        {/* Achievements */}
        <SectionErrorBoundary sectionName="Достижения">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Достижения</h2>
            {profile.discord_id ? (
              <AchievementsSection discordId={profile.discord_id} />
            ) : (
              <div className={styles.sectionEmpty}>
                <div className={styles.sectionEmptyIcon}>🏆</div>
                <p>Достижения доступны только для пользователей Discord</p>
              </div>
            )}
          </div>
        </SectionErrorBoundary>

        {/* Game Accounts */}
        <SectionErrorBoundary sectionName="Игровые аккаунты">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Привязанные аккаунты</h2>
            <GameAccountsSection
              isOwnProfile={true}
              apiUrl={API_URL}
              token={token}
            />
          </div>
        </SectionErrorBoundary>

        {/* Activity */}
        <SectionErrorBoundary sectionName="Активность">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Активность на сайте</h2>
            <div className={styles.sectionEmpty}>
              <div className={styles.sectionEmptyIcon}>📊</div>
              <p>Лайкнутые новости, посты и активность</p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>(В разработке)</p>
            </div>
          </div>
        </SectionErrorBoundary>
      </main>

      <Footer />
    </PageErrorBoundary>
  )
}
