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

        {/* Connected Accounts */}
        <SectionErrorBoundary sectionName="Привязанные аккаунты">
          <div className={styles.section}>
            <h2 className={styles.sectionTitle}>Привязанные аккаунты</h2>
            <div className={styles.accountsGrid}>
              {/* Discord */}
              <div className={styles.accountCard}>
                <div className={styles.accountInfo}>
                  <div className={`${styles.accountIcon} ${styles.accountIconDiscord}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
                    </svg>
                  </div>
                  <div className={styles.accountDetails}>
                    <div className={styles.accountName}>Discord</div>
                    {profile.discord_id ? (
                      <>
                        <div className={styles.accountUsername}>@{profile.discord_username}</div>
                        <div className={`${styles.accountStatus} ${styles.accountStatusConnected}`}>
                          ✓ Привязан
                        </div>
                      </>
                    ) : (
                      <div className={`${styles.accountStatus} ${styles.accountStatusDisconnected}`}>
                        Не привязан
                      </div>
                    )}
                  </div>
                </div>
                <div className={styles.accountActions}>
                  {profile.discord_id ? (
                    <button className={styles.disconnectButton} disabled>
                      Отвязать
                    </button>
                  ) : (
                    <button 
                      className={styles.connectButton}
                      onClick={() => window.location.href = `${API_URL}/api/auth/discord`}
                    >
                      Привязать
                    </button>
                  )}
                </div>
              </div>

              {/* Twitch */}
              <div className={styles.accountCard}>
                <div className={styles.accountInfo}>
                  <div className={`${styles.accountIcon} ${styles.accountIconTwitch}`}>
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                  </div>
                  <div className={styles.accountDetails}>
                    <div className={styles.accountName}>Twitch</div>
                    <div className={`${styles.accountStatus} ${styles.accountStatusDisconnected}`}>
                      Скоро
                    </div>
                  </div>
                </div>
                <div className={styles.accountActions}>
                  <button className={styles.connectButton} disabled>
                    Скоро
                  </button>
                </div>
              </div>
            </div>
          </div>
        </SectionErrorBoundary>

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
