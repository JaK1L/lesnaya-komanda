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

      if (selectedGames.has('Другое') && !customGameName.trim()) {
        setError('Введите название игры для "Другое"')
        setSaving(false)
        return
      }

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

      setSuccess('Профиль успешно обновлён!')
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
    if (token) loadProfile(token)
  }

  // Loading state
  if (loading) {
    return (
      <>
        <SkipToContent />
        <Navigation isAuthenticated={!!token} onLogout={handleLogout} apiUrl={API_URL} />
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
        <Navigation isAuthenticated={!!token} onLogout={handleLogout} apiUrl={API_URL} />
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

  return (
    <PageErrorBoundary pageName="Профиль">
      <SkipToContent />
      <Navigation isAuthenticated={!!token} onLogout={handleLogout} apiUrl={API_URL} />

      <main id="main-content" className={styles.container} tabIndex={-1}>
        {error && <div className={`${styles.message} ${styles.messageError}`}>{error}</div>}
        {success && <div className={`${styles.message} ${styles.messageSuccess}`}>{success}</div>}

        {/* TOP PROFILE CARD */}
        <SectionErrorBoundary sectionName="Профиль">
          <div className={styles.profileCard}>

            {/* Row 1: avatar + nick + achievements bar + edit button */}
            <div className={styles.topRow}>
              <div className={styles.avatarBlock}>
                <div className={styles.avatar}>
                  {avatarPreview || profile.avatar_url ? (
                    <img src={avatarPreview || profile.avatar_url || ''} alt={profile.discord_username} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {profile.discord_username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.nickBlock}>
                  <span className={styles.nickName}>
                    {profile.site_nickname || profile.discord_username}
                    {profile.user_tag && <span className={styles.userTag}>#{profile.user_tag}</span>}
                  </span>
                  {profile.site_nickname && (
                    <span className={styles.realName}>{profile.discord_username}</span>
                  )}
                </div>
              </div>

              <div className={styles.achievementsBar}>
                <span className={styles.achievementsBarLabel}>Достижения</span>
                {/* icons placeholder — will be populated via AchievementsSection data */}
              </div>

              <button
                onClick={() => setIsEditMode(!isEditMode)}
                className={styles.editButton}
              >
                {isEditMode ? 'Отменить' : 'Редактировать профиль'}
              </button>
            </div>

            {/* Row 2: about + achievements details */}
            <div className={styles.infoRow}>
              <div className={styles.bioBox}>
                {isEditMode ? (
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
                      <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
                        {saving ? 'Сохранение...' : 'Сохранить изменения'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span className={styles.bioLabel}>О СЕБЕ</span>
                    <p className={styles.bioText}>{profile.bio || ''}</p>
                  </>
                )}
              </div>

              <div className={styles.achievementsDetails}>
                <span className={styles.achievementsDetailsTitle}>Достижения</span>
                <div className={styles.achievementsDetailsContent}>
                  <div className={styles.achievementStat}>
                    <span className={styles.achievementStatLabel}>Ранг</span>
                    <span className={styles.achievementStatValue}>{profile.forest_rank || 'Нет'}</span>
                  </div>
                  <div className={styles.achievementStat}>
                    <span className={styles.achievementStatLabel}>Рейтинг</span>
                    <span className={styles.achievementStatValue}>{profile.rating}</span>
                  </div>
                  {profile.joined_at && (
                    <div className={styles.achievementStat}>
                      <span className={styles.achievementStatLabel}>На сайте с</span>
                      <span className={styles.achievementStatValue}>
                        {new Date(profile.joined_at).toLocaleDateString('ru-RU')}
                      </span>
                    </div>
                  )}
                  {profile.discord_id ? (
                    <SectionErrorBoundary sectionName="Достижения">
                      <AchievementsSection discordId={profile.discord_id} />
                    </SectionErrorBoundary>
                  ) : (
                    <p className={styles.achievementsDetailsEmpty}>
                      Вся инфа о достижениях сколько получено и тд
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SectionErrorBoundary>

        {/* Game Preferences (edit mode) */}
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

        {/* BOTTOM SECTION: activity + linked accounts */}
        <div className={styles.bottomRow}>
          {/* Left: activity blocks */}
          <div className={styles.activityColumn}>
            <SectionErrorBoundary sectionName="Активность 1">
              <div className={styles.activityBlock}>
                <span className={styles.activityLabel}>Активность</span>
                <div className={styles.activityContent}>
                  <div className={styles.sectionEmpty}>
                    <div className={styles.sectionEmptyIcon}>📊</div>
                    <p>Лайкнутые новости и посты</p>
                    <p style={{ fontSize: '0.8rem', marginTop: '0.4rem', opacity: 0.6 }}>В разработке</p>
                  </div>
                </div>
              </div>
            </SectionErrorBoundary>

            <SectionErrorBoundary sectionName="Игровые аккаунты">
              <div className={styles.activityBlock}>
                <span className={styles.activityLabel}>Игровые аккаунты</span>
                <div className={styles.activityContent}>
                  <GameAccountsSection isOwnProfile={true} apiUrl={API_URL} token={token} />
                </div>
              </div>
            </SectionErrorBoundary>

            <SectionErrorBoundary sectionName="Игровые предпочтения">
              <div className={styles.activityBlock}>
                <span className={styles.activityLabel}>Игровые предпочтения</span>
                <div className={styles.activityContent}>
                  {selectedGames.size > 0 ? (
                    <div className={styles.gameTagsDisplay}>
                      {Array.from(selectedGames).map(game => (
                        <span key={game} className={styles.gameTag}>
                          {game === 'Другое' && customGameName ? customGameName : game}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <div className={styles.sectionEmpty}>
                      <p>Игровые предпочтения не указаны</p>
                    </div>
                  )}
                </div>
              </div>
            </SectionErrorBoundary>
          </div>

          {/* Right: linked accounts sidebar */}
          <SectionErrorBoundary sectionName="Привязанные аккаунты">
            <div className={styles.accountsSidebar}>
              <span className={styles.sidebarTitle}>Привязанные аккаунты</span>

              {/* Discord */}
              <div className={styles.sidebarAccount}>
                <div className={`${styles.sidebarAccountIcon} ${styles.iconDiscord}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                  </svg>
                </div>
                <div className={styles.sidebarAccountInfo}>
                  <span className={styles.sidebarAccountName}>Дискорд</span>
                  {profile.discord_id ? (
                    <span className={styles.sidebarAccountConnected}>@{profile.discord_username}</span>
                  ) : (
                    <button
                      className={styles.sidebarConnectBtn}
                      onClick={() => window.location.href = `${API_URL}/api/auth/discord`}
                    >
                      Привязать
                    </button>
                  )}
                </div>
              </div>

              {/* Twitch */}
              <div className={styles.sidebarAccount}>
                <div className={`${styles.sidebarAccountIcon} ${styles.iconTwitch}`}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                  </svg>
                </div>
                <div className={styles.sidebarAccountInfo}>
                  <span className={styles.sidebarAccountName}>Твич</span>
                  <span className={styles.sidebarAccountSoon}>Скоро</span>
                </div>
              </div>

              {/* Dota */}
              <div className={styles.sidebarAccount}>
                <div className={`${styles.sidebarAccountIcon} ${styles.iconDota}`}>
                  <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>D2</span>
                </div>
                <div className={styles.sidebarAccountInfo}>
                  <span className={styles.sidebarAccountName}>Дота</span>
                  <span className={styles.sidebarAccountSoon}>Скоро</span>
                </div>
              </div>

              <div className={styles.sidebarAccountsMore}>и тд</div>
            </div>
          </SectionErrorBoundary>
        </div>
      </main>

      <Footer />
    </PageErrorBoundary>
  )
}
