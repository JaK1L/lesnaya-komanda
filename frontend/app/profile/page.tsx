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
  level?: number
  current_xp?: number
  total_xp?: number
  points?: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

const XP_PER_LEVEL = 1000

type Tab = 'stats' | 'games' | 'achievements' | 'activity' | 'accounts'

export default function ProfilePage() {
  const router = useRouter()

  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [siteNickname, setSiteNickname] = useState('')
  const [bio, setBio] = useState('')
  const [isHidden, setIsHidden] = useState(false)
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const [customGameName, setCustomGameName] = useState('')
  const [gamePreferencesChanged, setGamePreferencesChanged] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('stats')

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
          if (pref.game === 'Другое' && pref.custom_name) customName = pref.custom_name
        })
      }
      setSelectedGames(games)
      setCustomGameName(customName)
    } catch (err) {
      console.error('Error loading game preferences:', err)
    }
  }

  const handleGameToggle = (game: string) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(game)) {
      newSelected.delete(game)
      if (game === 'Другое') setCustomGameName('')
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
    reader.onloadend = () => setAvatarPreview(reader.result as string)
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
        const uploadResponse = await axios.post(`${API_URL}/api/profile/avatar`, formData, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
        })
        uploadedAvatarUrl = uploadResponse.data.avatar_url
      }

      const updateData = {
        site_nickname: siteNickname.trim() || null,
        avatar_url: uploadedAvatarUrl || undefined,
        bio: bio.trim() || null,
        is_hidden: isHidden
      }

      const response = await axios.put<ProfileData>(`${API_URL}/api/profile`, updateData, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setProfile(response.data)
      setAvatarFile(null)

      if (gamePreferencesChanged || selectedGames.size > 0) {
        const preferences: GamePreference[] = Array.from(selectedGames).map(game => ({
          game,
          custom_name: game === 'Другое' ? customGameName.trim() : null
        }))
        await axios.put(`${API_URL}/api/users/game-preferences`, { preferences }, {
          headers: { Authorization: `Bearer ${token}` }
        })
        setGamePreferencesChanged(false)
      }

      setSuccess('Профиль успешно обновлён!')
      setIsEditMode(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      console.error('Error saving profile:', err)
      if (axios.isAxiosError(err)) {
        const detail = err.response?.data?.detail
        let msg = 'Не удалось сохранить профиль'
        if (typeof detail === 'string') msg = detail
        else if (Array.isArray(detail)) msg = detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ')
        setError(msg)
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
        <SkipToContent />
        <Navigation isAuthenticated={!!token} onLogout={handleLogout} apiUrl={API_URL} />
        <main id="main-content" className={styles.container} tabIndex={-1}>
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <p>Загрузка профиля...</p>
          </div>
        </main>
        <Footer />
      </>
    )
  }

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
              <button onClick={() => token && loadProfile(token)} className={styles.editButton} style={{ marginTop: '1rem' }}>
                Попробовать снова
              </button>
            </div>
          </div>
        </main>
        <Footer />
      </>
    )
  }

  const level = profile.level ?? 0
  const currentXp = profile.current_xp ?? 0
  const xpPercent = Math.min(100, Math.round((currentXp / XP_PER_LEVEL) * 100))
  const displayName = profile.site_nickname || profile.discord_username

  const tabs: { id: Tab; label: string }[] = [
    { id: 'stats', label: 'СТАТИСТИКА' },
    { id: 'games', label: 'ИГРЫ' },
    { id: 'achievements', label: 'ДОСТИЖЕНИЯ' },
    { id: 'activity', label: 'АКТИВНОСТЬ' },
    { id: 'accounts', label: 'АККАУНТЫ' },
  ]

  return (
    <PageErrorBoundary pageName="Профиль">
      <SkipToContent />
      <Navigation isAuthenticated={!!token} onLogout={handleLogout} apiUrl={API_URL} />

      <main id="main-content" className={styles.container} tabIndex={-1}>
        {error && <div className={`${styles.message} ${styles.messageError}`}>{error}</div>}
        {success && <div className={`${styles.message} ${styles.messageSuccess}`}>{success}</div>}

        {/* ── PROFILE HEADER ── */}
        <SectionErrorBoundary sectionName="Профиль">
          <div className={styles.profileCard}>
            <div className={styles.topRow}>
              {/* Avatar */}
              <div className={styles.avatarBlock}>
                <div className={styles.avatar}>
                  {avatarPreview || profile.avatar_url ? (
                    <img src={avatarPreview || profile.avatar_url || ''} alt={displayName} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.nickBlock}>
                  <span className={styles.nickName}>
                    {displayName}
                    {profile.user_tag && <span className={styles.userTag}>#{profile.user_tag}</span>}
                  </span>
                  {profile.site_nickname && (
                    <span className={styles.realName}>{profile.discord_username}</span>
                  )}
                  <span className={styles.rankBadge}>{profile.forest_rank}</span>
                </div>
              </div>

              {/* XP Bar */}
              <div className={styles.xpBlock}>
                <div className={styles.xpHeader}>
                  <span className={styles.xpLabel}>УРОВЕНЬ {level}</span>
                  <span className={styles.xpLabel}>{currentXp} / {XP_PER_LEVEL} XP</span>
                </div>
                <div className={styles.xpTrack}>
                  <div className={styles.xpFill} style={{ width: `${xpPercent}%` }} />
                </div>
              </div>

              <button onClick={() => setIsEditMode(!isEditMode)} className={styles.editButton}>
                {isEditMode ? 'Отменить' : 'Редактировать'}
              </button>
            </div>

            {/* Edit form */}
            {isEditMode && (
              <div className={styles.editForm}>
                <div className={styles.form}>
                  <div className={styles.formGrid}>
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
                      <label className={styles.formLabel}>Аватар</label>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleAvatarFileChange(e.target.files?.[0] || null)}
                        className={styles.formInput}
                      />
                    </div>
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

                <div className={styles.editGames}>
                  <span className={styles.formLabel}>Игровые предпочтения</span>
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
            )}

            {/* Bio (view mode) */}
            {!isEditMode && profile.bio && (
              <div className={styles.bioBox}>
                <span className={styles.bioLabel}>О СЕБЕ</span>
                <p className={styles.bioText}>{profile.bio}</p>
              </div>
            )}
          </div>
        </SectionErrorBoundary>

        {/* ── TABS ── */}
        <div className={styles.tabs}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── TAB CONTENT ── */}
        <div className={styles.tabContent} key={activeTab}>

          {/* СТАТИСТИКА */}
          {activeTab === 'stats' && (
            <div className={styles.statsGrid}>
              {[
                { label: 'РАНГ', value: profile.forest_rank, icon: '🏆' },
                { label: 'РЕЙТИНГ', value: profile.rating, icon: '⭐' },
                { label: 'УРОВЕНЬ', value: level, icon: '⚡' },
                { label: 'ОЧКИ', value: profile.points ?? 0, icon: '💎' },
                { label: 'NA САЙТЕ С', value: profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—', icon: '📅' },
              ].map(stat => (
                <div key={stat.label} className={styles.statCard}>
                  <span className={styles.statIcon}>{stat.icon}</span>
                  <span className={styles.statValue}>{stat.value}</span>
                  <span className={styles.statLabel}>{stat.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ИГРЫ */}
          {activeTab === 'games' && (
            <div className={styles.tabSection}>
              <SectionErrorBoundary sectionName="Игровые аккаунты">
                <div className={styles.activityBlock}>
                  <span className={styles.activityLabel}>Игровые аккаунты</span>
                  <div className={styles.activityContent}>
                    <GameAccountsSection isOwnProfile={true} apiUrl={API_URL} token={token} />
                  </div>
                </div>
              </SectionErrorBoundary>

              <div className={styles.activityBlock}>
                <span className={styles.activityLabel}>Предпочтения</span>
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
            </div>
          )}

          {/* ДОСТИЖЕНИЯ */}
          {activeTab === 'achievements' && (
            <div className={styles.tabSection}>
              <div className={styles.achievementsDetails}>
                <div className={styles.achievementsDetailsContent}>
                  <div className={styles.achievementStat}>
                    <span className={styles.achievementStatLabel}>Ранг</span>
                    <span className={styles.achievementStatValue}>{profile.forest_rank}</span>
                  </div>
                  <div className={styles.achievementStat}>
                    <span className={styles.achievementStatLabel}>Рейтинг</span>
                    <span className={styles.achievementStatValue}>{profile.rating}</span>
                  </div>
                </div>
              </div>
              {profile.discord_id ? (
                <SectionErrorBoundary sectionName="Достижения">
                  <AchievementsSection discordId={profile.discord_id} />
                </SectionErrorBoundary>
              ) : (
                <div className={styles.sectionEmpty}>
                  <div className={styles.sectionEmptyIcon}>🏅</div>
                  <p>Привяжите Discord для отображения достижений</p>
                </div>
              )}
            </div>
          )}

          {/* АКТИВНОСТЬ */}
          {activeTab === 'activity' && (
            <div className={styles.activityBlock}>
              <div className={styles.sectionEmpty}>
                <div className={styles.sectionEmptyIcon}>📊</div>
                <p>Активность</p>
                <p style={{ fontSize: '0.8rem', marginTop: '0.4rem', opacity: 0.6 }}>В разработке</p>
              </div>
            </div>
          )}

          {/* АККАУНТЫ */}
          {activeTab === 'accounts' && (
            <SectionErrorBoundary sectionName="Привязанные аккаунты">
              <div className={styles.accountsSidebar} style={{ maxWidth: '500px' }}>
                <span className={styles.sidebarTitle}>Привязанные аккаунты</span>

                <div className={styles.sidebarAccount}>
                  <div className={`${styles.sidebarAccountIcon} ${styles.iconDiscord}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                  </div>
                  <div className={styles.sidebarAccountInfo}>
                    <span className={styles.sidebarAccountName}>Discord</span>
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

                <div className={styles.sidebarAccount}>
                  <div className={`${styles.sidebarAccountIcon} ${styles.iconTwitch}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                  </div>
                  <div className={styles.sidebarAccountInfo}>
                    <span className={styles.sidebarAccountName}>Twitch</span>
                    <span className={styles.sidebarAccountSoon}>Скоро</span>
                  </div>
                </div>

                <div className={styles.sidebarAccount}>
                  <div className={`${styles.sidebarAccountIcon} ${styles.iconDota}`}>
                    <span style={{ fontWeight: 700, fontSize: '0.75rem' }}>D2</span>
                  </div>
                  <div className={styles.sidebarAccountInfo}>
                    <span className={styles.sidebarAccountName}>Dota 2</span>
                    <span className={styles.sidebarAccountSoon}>Скоро</span>
                  </div>
                </div>

                <div className={styles.sidebarAccountsMore}>и другие платформы — скоро</div>
              </div>
            </SectionErrorBoundary>
          )}
        </div>
      </main>

      <Footer />
    </PageErrorBoundary>
  )
}
