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

interface ActivityData {
  message_count: number
  voice_hours: number
  achievements: Array<{ name: string; icon: string; points: number; earned_at: string | null }>
  recent_messages: Array<{ type: string; channel: string; created_at: string | null }>
  recent_voice: Array<{ channel: string; joined_at: string | null; left_at: string | null; duration_minutes: number }>
}

interface LinkedAccount {
  id: number
  game: string
  account_id: string
  account_tag: string | null
  region: string | null
  linked_at: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'
const XP_PER_LEVEL = 1000

type Tab = 'stats' | 'games' | 'achievements' | 'activity' | 'accounts'

const TABS: { id: Tab; label: string }[] = [
  { id: 'stats',        label: 'Статистика'  },
  { id: 'games',        label: 'Игры'        },
  { id: 'achievements', label: 'Достижения'  },
  { id: 'activity',     label: 'Активность'  },
  { id: 'accounts',     label: 'Аккаунты'    },
]

export default function ProfilePage() {
  const router = useRouter()

  const [token,   setToken]   = useState<string | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [error,   setError]   = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const [siteNickname, setSiteNickname] = useState('')
  const [bio,          setBio]          = useState('')
  const [isHidden,     setIsHidden]     = useState(false)
  const [avatarFile,   setAvatarFile]   = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)

  const [selectedGames,         setSelectedGames]         = useState<Set<string>>(new Set())
  const [customGameName,        setCustomGameName]        = useState('')
  const [gamePreferencesChanged, setGamePreferencesChanged] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const [activeTab,  setActiveTab]  = useState<Tab>('stats')

  const [activityData,    setActivityData]    = useState<ActivityData | null>(null)
  const [activityLoading, setActivityLoading] = useState(false)
  const [linkedAccounts,  setLinkedAccounts]  = useState<LinkedAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(false)
  const [accountsLoaded,  setAccountsLoaded]  = useState(false)

  // ── Auth ──
  useEffect(() => {
    const stored = localStorage.getItem(TOKEN_KEY)
    if (!stored) { router.push('/'); return }
    setToken(stored)
    loadProfile(stored)
  }, [router])

  // ── Загрузка ──
  const loadProfile = async (authToken: string) => {
    try {
      setLoading(true)
      setError(null)
      const res = await axios.get<ProfileData>(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const d = res.data
      setProfile(d)
      setSiteNickname(d.site_nickname || '')
      setBio(d.bio || '')
      setIsHidden(d.is_hidden)
      setAvatarPreview(d.avatar_url)
      await loadGamePreferences(authToken)
    } catch (err) {
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
      const res = await axios.get(`${API_URL}/api/profile`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      const games = new Set<string>()
      let customName = ''
      if (Array.isArray((res.data as any).game_preferences)) {
        (res.data as any).game_preferences.forEach((p: GamePreference) => {
          games.add(p.game)
          if (p.game === 'Другое' && p.custom_name) customName = p.custom_name
        })
      }
      setSelectedGames(games)
      setCustomGameName(customName)
    } catch { /* silent */ }
  }

  const handleGameToggle = (game: string) => {
    const next = new Set(selectedGames)
    if (next.has(game)) { next.delete(game); if (game === 'Другое') setCustomGameName('') }
    else next.add(game)
    setSelectedGames(next)
    setGamePreferencesChanged(true)
  }

  const handleAvatarFileChange = (file: File | null) => {
    if (!file) return
    setAvatarFile(file)
    const r = new FileReader()
    r.onloadend = () => setAvatarPreview(r.result as string)
    r.readAsDataURL(file)
  }

  const handleSave = async () => {
    if (!token) return
    try {
      setSaving(true); setError(null); setSuccess(null)
      if (selectedGames.has('Другое') && !customGameName.trim()) {
        setError('Введите название игры для "Другое"'); setSaving(false); return
      }
      let uploadedAvatarUrl = ''
      if (avatarFile) {
        const fd = new FormData()
        fd.append('file', avatarFile)
        const up = await axios.post(`${API_URL}/api/profile/avatar`, fd, {
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        })
        uploadedAvatarUrl = up.data.avatar_url
      }
      const res = await axios.put<ProfileData>(`${API_URL}/api/profile`, {
        site_nickname: siteNickname.trim() || null,
        avatar_url: uploadedAvatarUrl || undefined,
        bio: bio.trim() || null,
        is_hidden: isHidden,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setProfile(res.data)
      setAvatarFile(null)
      if (gamePreferencesChanged || selectedGames.size > 0) {
        const prefs: GamePreference[] = Array.from(selectedGames).map(g => ({
          game: g, custom_name: g === 'Другое' ? customGameName.trim() : null,
        }))
        await axios.put(`${API_URL}/api/users/game-preferences`, { preferences: prefs }, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setGamePreferencesChanged(false)
      }
      setSuccess('Профиль обновлён')
      setIsEditMode(false)
      setTimeout(() => setSuccess(null), 3000)
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const d = err.response?.data?.detail
        setError(typeof d === 'string' ? d : Array.isArray(d) ? d.map((x: any) => x.msg || '').join(', ') : 'Не удалось сохранить')
      } else setError('Не удалось сохранить')
    } finally { setSaving(false) }
  }

  const handleLogout = () => { localStorage.removeItem(TOKEN_KEY); router.push('/') }

  // ── Активность ──
  const loadActivityData = async () => {
    if (!token) return
    try {
      setActivityLoading(true)
      const res = await axios.get(`${API_URL}/api/profile/activity`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setActivityData({
        message_count: res.data.message_count ?? 0,
        voice_hours: res.data.voice_hours ?? 0,
        achievements: res.data.achievements ?? [],
        recent_messages: res.data.recent_messages ?? [],
        recent_voice: res.data.recent_voice ?? [],
      })
    } catch { /* silent */ }
    finally { setActivityLoading(false) }
  }

  // ── Привязанные аккаунты ──
  const loadLinkedAccounts = async (authToken: string) => {
    try {
      setAccountsLoading(true)
      const res = await axios.get(`${API_URL}/api/game-stats/my-accounts`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
      setLinkedAccounts(res.data || [])
    } catch { /* silent */ }
    finally { setAccountsLoading(false); setAccountsLoaded(true) }
  }

  // ── Ленивая загрузка по табам ──
  useEffect(() => {
    if (!profile) return
    if (activeTab === 'activity' && !activityData && !activityLoading) {
      loadActivityData()
    }
    if (activeTab === 'accounts' && !accountsLoaded && !accountsLoading && token) {
      loadLinkedAccounts(token)
    }
  }, [activeTab, profile])

  // ── Loading ──
  if (loading) return (
    <>
      <SkipToContent />
      <Navigation isAuthenticated={!!token} onLogout={handleLogout} apiUrl={API_URL} />
      <main id="main-content" className={styles.container} tabIndex={-1}>
        <div className={styles.loading}>
          <div className={styles.spinner} />
          <span>Загрузка профиля...</span>
        </div>
      </main>
      <Footer />
    </>
  )

  // ── Error ──
  if (error || !profile) return (
    <>
      <SkipToContent />
      <Navigation isAuthenticated={!!token} onLogout={handleLogout} apiUrl={API_URL} />
      <main id="main-content" className={styles.container} tabIndex={-1}>
        <div className={styles.errorCard}>
          <span className={styles.errorIcon}>⚠️</span>
          <p className={styles.errorTitle}>Ошибка загрузки</p>
          <p className={styles.errorText}>{error || 'Не удалось загрузить данные профиля'}</p>
          <button onClick={() => token && loadProfile(token)} className={styles.retryBtn}>
            Попробовать снова
          </button>
        </div>
      </main>
      <Footer />
    </>
  )

  const level      = profile.level      ?? 0
  const currentXp  = profile.current_xp ?? 0
  const points     = profile.points     ?? 0
  const xpPercent  = Math.min(100, Math.round((currentXp / XP_PER_LEVEL) * 100))
  const displayName = profile.site_nickname || profile.discord_username

  const joinedStr = profile.joined_at
    ? new Date(profile.joined_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' })
    : '—'

  return (
    <PageErrorBoundary pageName="Профиль">
      <SkipToContent />
      <Navigation isAuthenticated={!!token} onLogout={handleLogout} apiUrl={API_URL} />

      <main id="main-content" className={styles.container} tabIndex={-1}>

        {/* ── Уведомления ── */}
        {error   && <div className={`${styles.message} ${styles.messageError}`}>{error}</div>}
        {success && <div className={`${styles.message} ${styles.messageSuccess}`}>{success}</div>}

        {/* ════ HERO CARD ════ */}
        <SectionErrorBoundary sectionName="Профиль">
          <div className={styles.heroCard}>
            <div className={styles.heroTop}>

              {/* Аватар */}
              <div className={styles.avatarWrap}>
                <div className={styles.avatar}>
                  {avatarPreview || profile.avatar_url ? (
                    <img src={avatarPreview || profile.avatar_url || ''} alt={displayName} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {displayName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.onlineDot} />
              </div>

              {/* Инфо */}
              <div className={styles.heroInfo}>
                <div className={styles.heroName}>
                  {displayName}
                  {profile.user_tag && <span className={styles.heroTag}>#{profile.user_tag}</span>}
                </div>
                {profile.site_nickname && (
                  <div className={styles.heroDiscord}>@{profile.discord_username}</div>
                )}
                <div className={styles.heroBadges}>
                  <span className={styles.rankBadge}>{profile.forest_rank}</span>
                </div>
                {profile.bio && !isEditMode && (
                  <p className={styles.heroBio}>{profile.bio}</p>
                )}
              </div>

              {/* Кнопка редактирования */}
              <button onClick={() => setIsEditMode(!isEditMode)} className={styles.editBtn}>
                {isEditMode ? (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Отменить
                  </>
                ) : (
                  <>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Изменить
                  </>
                )}
              </button>
            </div>

            {/* XP-бар */}
            <div className={styles.xpSection}>
              <div className={styles.xpMeta}>
                <span className={styles.xpLevelLabel}>Уровень {level}</span>
                <span className={styles.xpCountLabel}>{currentXp} / {XP_PER_LEVEL} XP</span>
              </div>
              <div className={styles.xpTrack}>
                <div className={styles.xpFill} style={{ width: `${xpPercent}%` }} />
              </div>
            </div>
          </div>
        </SectionErrorBoundary>

        {/* ════ QUICK STATS ════ */}
        <div className={styles.quickStats}>
          {[
            { value: level,           label: 'Уровень' },
            { value: profile.rating,  label: 'Рейтинг' },
            { value: points,          label: 'Очки'    },
            { value: joinedStr,       label: 'На сайте с' },
          ].map(s => (
            <div key={s.label} className={styles.quickStatCard}>
              <span className={styles.quickStatValue}>{s.value}</span>
              <span className={styles.quickStatLabel}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* ════ ФОРМА РЕДАКТИРОВАНИЯ ════ */}
        {isEditMode && (
          <div className={styles.editPanel}>
            <div className={styles.editPanelTitle}>Редактирование профиля</div>
            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Никнейм на сайте</label>
                <input
                  type="text"
                  className={styles.formInput}
                  value={siteNickname}
                  onChange={e => setSiteNickname(e.target.value)}
                  placeholder={profile.discord_username}
                />
              </div>
              <div className={styles.formGroup}>
                <label className={styles.formLabel}>Аватар</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => handleAvatarFileChange(e.target.files?.[0] || null)}
                  className={styles.formInput}
                />
              </div>
              <div className={`${styles.formGroup} ${styles.formGroupFull}`}>
                <label className={styles.formLabel}>О себе</label>
                <textarea
                  className={styles.formTextarea}
                  value={bio}
                  onChange={e => setBio(e.target.value)}
                  placeholder="Расскажите о себе..."
                />
              </div>
            </div>
            <div className={styles.formCheckbox}>
              <input
                type="checkbox"
                id="isHidden"
                checked={isHidden}
                onChange={e => setIsHidden(e.target.checked)}
              />
              <label htmlFor="isHidden">Скрыть профиль от других пользователей</label>
            </div>
            <div className={styles.formActions}>
              <button onClick={handleSave} disabled={saving} className={styles.saveButton}>
                {saving ? 'Сохранение...' : 'Сохранить изменения'}
              </button>
            </div>

            <div className={styles.editGamesSection}>
              <span className={styles.editGamesLabel}>Игровые предпочтения</span>
              <GamePreferencesSection
                selectedGames={selectedGames}
                customGameName={customGameName}
                onGameToggle={handleGameToggle}
                onCustomGameNameChange={name => { setCustomGameName(name); setGamePreferencesChanged(true) }}
              />
            </div>
          </div>
        )}

        {/* ════ ТАБЫ ════ */}
        <div className={styles.tabs}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`${styles.tabBtn} ${activeTab === tab.id ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ════ КОНТЕНТ ТАБОВ ════ */}
        <div className={styles.tabContent} key={activeTab}>

          {/* СТАТИСТИКА */}
          {activeTab === 'stats' && (
            <div className={styles.statsGrid}>
              {[
                { icon: '🏆', value: profile.forest_rank, label: 'Ранг'        },
                { icon: '⭐', value: profile.rating,      label: 'Рейтинг'     },
                { icon: '⚡', value: level,               label: 'Уровень'     },
                { icon: '💎', value: points,              label: 'Очки'        },
                { icon: '📅', value: joinedStr,           label: 'На сайте с'  },
                { icon: '📊', value: `${xpPercent}%`,    label: 'Прогресс XP' },
              ].map(s => (
                <div key={s.label} className={styles.statCard}>
                  <span className={styles.statCardIcon}>{s.icon}</span>
                  <span className={styles.statCardValue}>{s.value}</span>
                  <span className={styles.statCardLabel}>{s.label}</span>
                </div>
              ))}
            </div>
          )}

          {/* ИГРЫ */}
          {activeTab === 'games' && (
            <>
              <SectionErrorBoundary sectionName="Игровые аккаунты">
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionBlockTitle}>Игровые аккаунты</div>
                  <GameAccountsSection isOwnProfile={true} apiUrl={API_URL} token={token} />
                </div>
              </SectionErrorBoundary>

              <div className={styles.sectionBlock}>
                <div className={styles.sectionBlockTitle}>Предпочтения</div>
                {selectedGames.size > 0 ? (
                  <div className={styles.gameTagsDisplay}>
                    {Array.from(selectedGames).map(game => (
                      <span key={game} className={styles.gameTag}>
                        {game === 'Другое' && customGameName ? customGameName : game}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--color-white-64)' }}>
                    Игровые предпочтения не указаны
                  </p>
                )}
              </div>
            </>
          )}

          {/* ДОСТИЖЕНИЯ */}
          {activeTab === 'achievements' && (
            <>
              <div className={styles.achievementsMeta}>
                <div className={styles.achievementMetaItem}>
                  <span className={styles.achievementMetaLabel}>Ранг</span>
                  <span className={styles.achievementMetaValue}>{profile.forest_rank}</span>
                </div>
                <div className={styles.achievementMetaItem}>
                  <span className={styles.achievementMetaLabel}>Рейтинг</span>
                  <span className={styles.achievementMetaValue}>{profile.rating}</span>
                </div>
                <div className={styles.achievementMetaItem}>
                  <span className={styles.achievementMetaLabel}>Очки</span>
                  <span className={styles.achievementMetaValue}>{points}</span>
                </div>
              </div>

              {profile.discord_id ? (
                <SectionErrorBoundary sectionName="Достижения">
                  <AchievementsSection discordId={profile.discord_id} />
                </SectionErrorBoundary>
              ) : (
                <div className={styles.emptyState}>
                  <span className={styles.emptyStateIcon}>🏅</span>
                  <p className={styles.emptyStateTitle}>Достижения недоступны</p>
                  <p className={styles.emptyStateText}>Привяжите Discord-аккаунт</p>
                </div>
              )}
            </>
          )}

          {/* АКТИВНОСТЬ */}
          {activeTab === 'activity' && (
            activityLoading ? (
              <div className={styles.emptyState}>
                <div className={styles.spinner} style={{ marginBottom: '1rem' }} />
                <p className={styles.emptyStateTitle}>Загрузка активности...</p>
              </div>
            ) : activityData ? (
              <>
                {/* Discord-статистика */}
                <div className={styles.statsGrid} style={{ marginBottom: '1rem' }}>
                  <div className={styles.statCard}>
                    <span className={styles.statCardIcon}>💬</span>
                    <span className={styles.statCardValue}>{activityData.message_count}</span>
                    <span className={styles.statCardLabel}>Сообщений в Discord</span>
                  </div>
                  <div className={styles.statCard}>
                    <span className={styles.statCardIcon}>🎤</span>
                    <span className={styles.statCardValue}>{Math.round(activityData.voice_hours * 10) / 10}</span>
                    <span className={styles.statCardLabel}>Часов в голосовых</span>
                  </div>
                </div>

                {/* Последние голосовые */}
                {activityData.recent_voice.length > 0 && (
                  <div className={styles.sectionBlock}>
                    <div className={styles.sectionBlockTitle}>Последние голосовые сессии</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {activityData.recent_voice.map((v, i) => (
                        <div key={i} className={styles.activityItem}>
                          <span className={styles.activityItemIcon}>🎤</span>
                          <div className={styles.activityItemInfo}>
                            <div className={styles.activityItemName}>{v.channel}</div>
                            {v.joined_at && (
                              <div className={styles.activityItemDate}>
                                {new Date(v.joined_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                              </div>
                            )}
                          </div>
                          <span className={styles.activityItemPoints}>{v.duration_minutes} мин</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Последние достижения */}
                <div className={styles.sectionBlock}>
                  <div className={styles.sectionBlockTitle}>
                    Последние достижения ({activityData.achievements.length})
                  </div>
                  {activityData.achievements.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '1.5rem 0', color: 'var(--color-white-64)', fontSize: '0.85rem' }}>
                      Пока нет достижений — участвуйте в жизни сообщества!
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {activityData.achievements.map((a, i) => (
                        <div key={i} className={styles.activityItem}>
                          <span className={styles.activityItemIcon}>{a.icon}</span>
                          <div className={styles.activityItemInfo}>
                            <div className={styles.activityItemName}>{a.name}</div>
                            {a.earned_at && (
                              <div className={styles.activityItemDate}>
                                {new Date(a.earned_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })}
                              </div>
                            )}
                          </div>
                          <span className={styles.activityItemPoints}>+{a.points} очков</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className={styles.emptyState}>
                <span className={styles.emptyStateIcon}>📊</span>
                <p className={styles.emptyStateTitle}>Данные недоступны</p>
                <p className={styles.emptyStateText}>Привяжите Discord для отображения активности</p>
              </div>
            )
          )}

          {/* АККАУНТЫ */}
          {activeTab === 'accounts' && (
            <SectionErrorBoundary sectionName="Аккаунты">
              <div className={styles.accountsList}>
                {/* Discord */}
                <div className={styles.accountRow}>
                  <div className={`${styles.accountIcon} ${styles.iconDiscord}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
                    </svg>
                  </div>
                  <div className={styles.accountInfo}>
                    <div className={styles.accountName}>Discord</div>
                    {profile.discord_id ? (
                      <div className={styles.accountUsername}>@{profile.discord_username}</div>
                    ) : (
                      <div className={styles.accountSoon}>Не привязан</div>
                    )}
                  </div>
                  {profile.discord_id ? (
                    <div className={styles.accountStatus}>
                      <div className={`${styles.accountStatusDot} ${styles.connected}`} />
                      <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>Подключён</span>
                    </div>
                  ) : (
                    <button
                      className={styles.connectBtn}
                      onClick={() => window.location.href = `${API_URL}/api/auth/discord`}
                    >
                      Привязать
                    </button>
                  )}
                </div>

                {/* Steam */}
                {(() => {
                  const steamAcc = linkedAccounts.find(a => a.game === 'steam')
                  return (
                    <div className={styles.accountRow}>
                      <div className={`${styles.accountIcon} ${styles.iconSteam}`}>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.979 0C5.678 0 .511 4.86.022 11.037l6.432 2.658c.545-.371 1.203-.59 1.912-.59.063 0 .125.004.187.006l2.861-4.142V8.91c0-2.495 2.028-4.524 4.524-4.524 2.494 0 4.524 2.031 4.524 4.527s-2.03 4.525-4.524 4.525h-.105l-4.076 2.911c0 .052.004.105.004.159 0 1.875-1.515 3.396-3.39 3.396-1.635 0-3.016-1.173-3.331-2.727L.436 15.27C1.862 20.307 6.486 24 11.979 24c6.627 0 11.999-5.373 11.999-12S18.606 0 11.979 0zM7.54 18.21l-1.473-.61c.262.543.714.999 1.314 1.25 1.297.539 2.793-.076 3.332-1.375.263-.63.264-1.319.005-1.949s-.75-1.121-1.377-1.383c-.624-.26-1.29-.249-1.878-.03l1.523.63c.956.4 1.409 1.5 1.009 2.455-.397.957-1.497 1.41-2.455 1.012H7.54zm11.415-9.303c0-1.662-1.353-3.015-3.015-3.015-1.665 0-3.015 1.353-3.015 3.015 0 1.665 1.35 3.015 3.015 3.015 1.663 0 3.015-1.35 3.015-3.015zm-5.273-.005c0-1.252 1.013-2.266 2.265-2.266 1.249 0 2.266 1.014 2.266 2.266 0 1.251-1.017 2.265-2.266 2.265-1.252 0-2.265-1.014-2.265-2.265z"/>
                        </svg>
                      </div>
                      <div className={styles.accountInfo}>
                        <div className={styles.accountName}>Steam</div>
                        {steamAcc ? (
                          <div className={styles.accountUsername}>{steamAcc.account_id}</div>
                        ) : (
                          <div className={styles.accountSoon}>Не привязан</div>
                        )}
                      </div>
                      {steamAcc ? (
                        <div className={styles.accountStatus}>
                          <div className={`${styles.accountStatusDot} ${styles.connected}`} />
                          <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>Подключён</span>
                        </div>
                      ) : (
                        <button className={styles.connectBtn} onClick={() => setActiveTab('games')}>
                          Привязать
                        </button>
                      )}
                    </div>
                  )
                })()}

                {/* Dota 2 */}
                {(() => {
                  const dota2Acc = linkedAccounts.find(a => a.game === 'dota2')
                  return (
                    <div className={styles.accountRow}>
                      <div className={`${styles.accountIcon} ${styles.iconDota}`}>
                        <span>D2</span>
                      </div>
                      <div className={styles.accountInfo}>
                        <div className={styles.accountName}>Dota 2</div>
                        {dota2Acc ? (
                          <div className={styles.accountUsername}>{dota2Acc.account_id}</div>
                        ) : (
                          <div className={styles.accountSoon}>Не привязан</div>
                        )}
                      </div>
                      {dota2Acc ? (
                        <div className={styles.accountStatus}>
                          <div className={`${styles.accountStatusDot} ${styles.connected}`} />
                          <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>Подключён</span>
                        </div>
                      ) : (
                        <button className={styles.connectBtn} onClick={() => setActiveTab('games')}>
                          Привязать
                        </button>
                      )}
                    </div>
                  )
                })()}

                {/* Valorant */}
                {(() => {
                  const valAcc = linkedAccounts.find(a => a.game === 'valorant')
                  return (
                    <div className={styles.accountRow}>
                      <div className={`${styles.accountIcon} ${styles.iconValorant}`}>
                        <span style={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: '-0.02em' }}>VAL</span>
                      </div>
                      <div className={styles.accountInfo}>
                        <div className={styles.accountName}>Valorant</div>
                        {valAcc ? (
                          <div className={styles.accountUsername}>
                            {valAcc.account_id}{valAcc.account_tag ? `#${valAcc.account_tag}` : ''}
                          </div>
                        ) : (
                          <div className={styles.accountSoon}>Не привязан</div>
                        )}
                      </div>
                      {valAcc ? (
                        <div className={styles.accountStatus}>
                          <div className={`${styles.accountStatusDot} ${styles.connected}`} />
                          <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 600 }}>Подключён</span>
                        </div>
                      ) : (
                        <button className={styles.connectBtn} onClick={() => setActiveTab('games')}>
                          Привязать
                        </button>
                      )}
                    </div>
                  )
                })()}

                {/* Twitch */}
                <div className={styles.accountRow}>
                  <div className={`${styles.accountIcon} ${styles.iconTwitch}`}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                  </div>
                  <div className={styles.accountInfo}>
                    <div className={styles.accountName}>Twitch</div>
                    <div className={styles.accountSoon}>Скоро</div>
                  </div>
                  <div className={styles.accountStatus}>
                    <div className={`${styles.accountStatusDot} ${styles.pending}`} />
                    <span style={{ color: 'var(--color-white-64)', fontSize: '0.75rem' }}>Скоро</span>
                  </div>
                </div>

                {accountsLoading && (
                  <div style={{ textAlign: 'center', padding: '0.75rem', color: 'var(--color-white-64)', fontSize: '0.8rem' }}>
                    Загрузка игровых аккаунтов...
                  </div>
                )}
              </div>
            </SectionErrorBoundary>
          )}

        </div>
      </main>

      <Footer />
    </PageErrorBoundary>
  )
}
