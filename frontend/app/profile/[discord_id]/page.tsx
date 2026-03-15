'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { UserPlus, Trophy, Star, Calendar, Copy, Check, ChevronLeft, Edit2, X, Camera, Twitch, Image as ImageIcon, Award, Activity, BarChart2, Users } from 'lucide-react'
import { Navigation } from '../../../components/layout/Navigation'
import { Footer } from '../../../components/layout/Footer'
import { getImageUrl } from '../../../lib/imageUtils'
import { apiClient } from '../../../lib/api'
import { getAuthIdentityFromToken } from '../../../lib/profileIdentifier'
import styles from './profile.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'
const XP_PER_LEVEL_FALLBACK = 1000
const MAX_AVATAR_SIZE = 5 * 1024 * 1024
const MAX_BANNER_SIZE = 8 * 1024 * 1024
const VALID_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

interface Role {
  id: number
  name: string
  color: string
}

interface GameAccount {
  game: string
  account_id: string
  account_tag: string | null
  region: string | null
}

interface PublicProfile {
  user_id: number
  discord_id: number | null
  site_nickname: string | null
  discord_username: string
  avatar_url: string | null
  banner_url: string | null
  bio: string | null
  forest_rank: string
  rating: number
  level: number
  current_xp: number
  total_xp: number
  xp_for_next_level?: number
  points: number
  joined_at: string | null
  tourney_stats: { played: number; wins: number }
  twitch_username: string | null
  is_hidden: boolean
  roles: Role[]
}

interface MediaItem {
  id: number
  title: string | null
  description: string | null
  media_type: string
  file_url: string
  created_at: string
}

interface Achievement {
  id: number
  achievement_type_id: number
  name: string
  description: string
  icon: string
  category: string
  points: number
  completed_at: string
}

interface TournamentRegistration {
  id: number
  title: string
  game: string | null
  status: string
  start_date: string | null
  prize: string | null
  nickname: string | null
  team_name: string | null
  registered_at: string | null
}

interface ActivityMessage {
  type: string | null
  channel: string | null
  created_at: string | null
}

interface ActivityVoiceSession {
  channel: string | null
  joined_at: string | null
  left_at: string | null
  duration_minutes: number
}

interface PublicActivity {
  message_count: number
  voice_hours: number
  recent_messages: ActivityMessage[]
  recent_voice: ActivityVoiceSession[]
}

interface ShowcaseAchievement {
  id: number
  name: string
  description: string
  icon: string
  points: number
}

export default function PublicProfilePage() {
  const { discord_id } = useParams<{ discord_id: string }>()
  const profileIdentifier = String(discord_id ?? '').trim()
  const encodedProfileIdentifier = encodeURIComponent(profileIdentifier)
  const router = useRouter()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'incoming' | 'friends'>('none')
  const [friendLoading, setFriendLoading] = useState(false)
  const [tab, setTab] = useState<'media' | 'stats' | 'tournaments' | 'activity' | 'achievements'>('media')
  const [media, setMedia] = useState<MediaItem[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([])
  const [activity, setActivity] = useState<PublicActivity | null>(null)
  const [showcase, setShowcase] = useState<ShowcaseAchievement[]>([])
  const [showcaseSelection, setShowcaseSelection] = useState<number[]>([])
  const [tabLoaded, setTabLoaded] = useState<Record<string, boolean>>({})
  const [mediaLoading, setMediaLoading] = useState(false)
  const [achievementsLoading, setAchievementsLoading] = useState(false)
  const [registrationsLoading, setRegistrationsLoading] = useState(false)
  const [activityLoading, setActivityLoading] = useState(false)
  const [bannerUploading, setBannerUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const [gameAccounts, setGameAccounts] = useState<GameAccount[]>([])
  const [achievPickerOpen, setAchievPickerOpen] = useState(false)
  const [showcaseSaving, setShowcaseSaving] = useState(false)

  // Edit mode
  const [editOpen, setEditOpen] = useState(false)
  const [editNick, setEditNick] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editHidden, setEditHidden] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [twitchInput, setTwitchInput] = useState('')
  const [twitchSaving, setTwitchSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const statusTimerRef = useRef<number | null>(null)

  const clearStatusTimer = () => {
    if (statusTimerRef.current !== null) {
      window.clearTimeout(statusTimerRef.current)
      statusTimerRef.current = null
    }
  }

  const showStatus = (type: 'success' | 'error', text: string) => {
    clearStatusTimer()
    setStatusMessage({ type, text })
    statusTimerRef.current = window.setTimeout(() => {
      setStatusMessage(null)
      statusTimerRef.current = null
    }, 3500)
  }

  const getErrorMessage = (error: unknown, fallback: string) => {
    if (axios.isAxiosError(error)) {
      const detail = (error.response?.data as { detail?: string } | undefined)?.detail
      if (detail) return detail
    }
    return fallback
  }

  const withAuthHeader = (value?: string | null) => (
    value
      ? { headers: { Authorization: `Bearer ${value}` } }
      : {}
  )

  const validateImageFile = (file: File, maxSize: number) => {
    if (!VALID_IMAGE_MIME_TYPES.includes(file.type)) {
      showStatus('error', 'Only JPEG, PNG, GIF and WebP files are supported')
      return false
    }

    if (file.size > maxSize) {
      showStatus('error', `File size must be below ${Math.round(maxSize / 1024 / 1024)}MB`)
      return false
    }

    return true
  }

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    setToken(t)
    setError(null)
    setLoading(true)
    setTabLoaded({})
    setMedia([])
    setAchievements([])
    setRegistrations([])
    setActivity(null)
    setShowcase([])
    setShowcaseSelection([])
    clearStatusTimer()
    setStatusMessage(null)

    void loadProfile(t)
    void loadGameAccounts()
    void loadShowcase()
    if (t) void loadFriendStatus(t)
    else setFriendStatus('none')

    return () => {
      clearStatusTimer()
    }
  }, [profileIdentifier])

  const loadProfile = async (t?: string | null) => {
    try {
      const res = await apiClient.get<PublicProfile>(`/api/profile/public/${encodedProfileIdentifier}`, withAuthHeader(t))
      setProfile(res.data)
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const s = error.response?.status
        setError(s === 404 ? 'Профиль не найден' : s === 403 ? 'Профиль скрыт' : 'Ошибка загрузки профиля')
      } else {
        setError('Ошибка загрузки профиля')
      }
    } finally {
      setLoading(false)
    }
  }

  const loadFriendStatus = async (t: string) => {
    try {
      const res = await apiClient.get<{ status: 'none' | 'pending' | 'incoming' | 'friends' }>(`/api/friends/status/${encodedProfileIdentifier}`, {
        headers: { Authorization: `Bearer ${t}` },
      })
      setFriendStatus(res.data.status)
    } catch {
      setFriendStatus('none')
    }
  }

  const loadMedia = async () => {
    if (tabLoaded.media) return

    setMediaLoading(true)
    try {
      const res = await apiClient.get<MediaItem[]>(`/api/profile/public/${encodedProfileIdentifier}/media`, withAuthHeader(token))
      setMedia(res.data)
      setTabLoaded(p => ({ ...p, media: true }))
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to load media'))
    } finally {
      setMediaLoading(false)
    }
  }

  const loadAchievements = async () => {
    if (tabLoaded.achievements) return

    setAchievementsLoading(true)
    try {
      const res = await apiClient.get<Achievement[]>(`/api/achievements/user/${encodedProfileIdentifier}?completed_only=true`)
      setAchievements(res.data)
      setTabLoaded(p => ({ ...p, achievements: true }))
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to load achievements'))
    } finally {
      setAchievementsLoading(false)
    }
  }

  const loadRegistrations = async () => {
    if (tabLoaded.tournaments) return

    setRegistrationsLoading(true)
    try {
      const res = await apiClient.get<TournamentRegistration[]>(`/api/profile/public/${encodedProfileIdentifier}/registrations`, withAuthHeader(token))
      setRegistrations(res.data)
      setTabLoaded(p => ({ ...p, tournaments: true }))
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to load tournaments'))
    } finally {
      setRegistrationsLoading(false)
    }
  }

  const loadActivity = async () => {
    if (tabLoaded.activity) return

    setActivityLoading(true)
    try {
      const res = await apiClient.get<PublicActivity>(`/api/profile/public/${encodedProfileIdentifier}/activity`, withAuthHeader(token))
      setActivity(res.data)
      setTabLoaded(p => ({ ...p, activity: true }))
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to load activity'))
    } finally {
      setActivityLoading(false)
    }
  }

  const loadGameAccounts = async () => {
    try {
      const res = await apiClient.get<GameAccount[]>(`/api/game-stats/public/${encodedProfileIdentifier}/accounts`)
      setGameAccounts(res.data)
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to load linked game accounts'))
    }
  }

  const loadShowcase = async () => {
    try {
      const res = await apiClient.get<ShowcaseAchievement[]>(`/api/achievements/showcase/${encodedProfileIdentifier}`)
      setShowcase(res.data)
      setShowcaseSelection(res.data.map((item) => item.id))
    } catch {
      setShowcase([])
      setShowcaseSelection([])
    }
  }

  useEffect(() => {
    if (tab === 'media') void loadMedia()
    if (tab === 'achievements') void loadAchievements()
    if (tab === 'tournaments') void loadRegistrations()
    if (tab === 'activity') void loadActivity()
  }, [tab, encodedProfileIdentifier, token])

  const toggleShowcaseSelection = (achievementTypeId: number) => {
    setShowcaseSelection((prev) => {
      if (prev.includes(achievementTypeId)) {
        return prev.filter((id) => id !== achievementTypeId)
      }
      if (prev.length >= 3) {
        showStatus('error', 'You can pin up to 3 achievements')
        return prev
      }
      return [...prev, achievementTypeId]
    })
  }

  const saveShowcase = async () => {
    if (!token) return

    setShowcaseSaving(true)
    try {
      await apiClient.put('/api/achievements/showcase', { achievement_ids: showcaseSelection }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await loadShowcase()
      setAchievPickerOpen(false)
      showStatus('success', 'Showcase updated')
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to update showcase'))
    } finally {
      setShowcaseSaving(false)
    }
  }

  const openShowcasePicker = async () => {
    await loadAchievements()
    setAchievPickerOpen(true)
  }

  const sendFriendRequest = async () => {
    if (!token) return

    setFriendLoading(true)
    try {
      const res = await apiClient.post<{ status: 'sent' | 'accepted' }>(`/api/friends/request/${encodedProfileIdentifier}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      if (res.data.status === 'accepted') {
        setFriendStatus('friends')
        showStatus('success', 'Friend request accepted')
      } else {
        setFriendStatus('pending')
        showStatus('success', 'Friend request sent')
      }
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to send friend request'))
    } finally {
      setFriendLoading(false)
    }
  }

  const acceptIncomingRequest = async () => {
    if (!token) return

    setFriendLoading(true)
    try {
      await apiClient.post(`/api/friends/accept-user/${encodedProfileIdentifier}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFriendStatus('friends')
      showStatus('success', 'Friend request accepted')
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to accept friend request'))
    } finally {
      setFriendLoading(false)
    }
  }

  const removeFriend = async () => {
    if (!token) return

    setFriendLoading(true)
    try {
      await apiClient.delete(`/api/friends/remove/${encodedProfileIdentifier}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setFriendStatus('none')
      showStatus('success', 'Friend removed')
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to remove friend'))
    } finally {
      setFriendLoading(false)
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      showStatus('error', 'Unable to copy the link in this browser')
    }
  }

  const openEdit = () => {
    if (!profile) return
    setEditNick(profile.site_nickname ?? '')
    setEditBio(profile.bio ?? '')
    setEditHidden(profile.is_hidden ?? false)
    setTwitchInput(profile.twitch_username ?? '')
    setEditOpen(true)
  }

  const saveProfile = async () => {
    if (!token) return

    setEditSaving(true)
    try {
      const res = await apiClient.put<PublicProfile>('/api/profile', {
        site_nickname: editNick.trim() || null,
        bio: editBio.trim() || null,
        is_hidden: editHidden,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      })
      setProfile(p => p ? { ...p, ...res.data } : p)
      setEditOpen(false)
      showStatus('success', 'Profile saved')
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to save profile'))
    } finally {
      setEditSaving(false)
    }
  }

  const uploadBanner = async (file: File) => {
    if (!token) return
    if (!validateImageFile(file, MAX_BANNER_SIZE)) return

    const fd = new FormData()
    fd.append('file', file)

    setBannerUploading(true)
    try {
      const res = await apiClient.post<{ banner_url: string }>('/api/profile/banner', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      setProfile(p => p ? { ...p, banner_url: res.data.banner_url } : p)
      showStatus('success', 'Banner updated')
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to upload banner'))
    } finally {
      setBannerUploading(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    if (!token) return
    if (!validateImageFile(file, MAX_AVATAR_SIZE)) return

    const fd = new FormData()
    fd.append('file', file)

    setAvatarUploading(true)
    try {
      const res = await apiClient.post<{ avatar_url: string }>('/api/profile/avatar', fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      setProfile(p => p ? { ...p, avatar_url: res.data.avatar_url } : p)
      showStatus('success', 'Avatar updated')
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to upload avatar'))
    } finally {
      setAvatarUploading(false)
    }
  }

  const saveTwitch = async () => {
    if (!token) return

    setTwitchSaving(true)
    try {
      if (twitchInput.trim()) {
        await apiClient.post(`/api/profile/twitch?twitch_username=${encodeURIComponent(twitchInput.trim())}`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setProfile(p => p ? { ...p, twitch_username: twitchInput.trim() } : p)
        showStatus('success', 'Twitch account linked')
      } else {
        await apiClient.delete('/api/profile/twitch', { headers: { Authorization: `Bearer ${token}` } })
        setProfile(p => p ? { ...p, twitch_username: null } : p)
        showStatus('success', 'Twitch account unlinked')
      }
    } catch (error) {
      showStatus('error', getErrorMessage(error, 'Failed to update Twitch account'))
    } finally {
      setTwitchSaving(false)
    }
  }

  useEffect(() => {
    if (!editOpen && !achievPickerOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (achievPickerOpen) {
          setAchievPickerOpen(false)
          return
        }
        setEditOpen(false)
      }
    }

    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [editOpen, achievPickerOpen])

  const authIdentity = getAuthIdentityFromToken(token)
  const isOwnProfile = Boolean(
    (authIdentity.userId && profile?.user_id && authIdentity.userId === String(profile.user_id)) ||
    (authIdentity.discordId && profile?.discord_id && authIdentity.discordId === String(profile.discord_id))
  )

  if (loading) return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.loadingPage}><div className={styles.spinner} /></div>
    </>
  )

  if (error || !profile) return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.errorPage}>
        <h2>{error || 'РџСЂРѕС„РёР»СЊ РЅРµ РЅР°Р№РґРµРЅ'}</h2>
        <button onClick={() => router.push('/')} className={styles.backBtn}><ChevronLeft size={16} /> РќР° РіР»Р°РІРЅСѓСЋ</button>
      </div>
    </>
  )

  const displayName = profile.site_nickname || profile.discord_username
  const xpForNextLevel = Math.max(1, profile.xp_for_next_level ?? XP_PER_LEVEL_FALLBACK)
  const xpPercent = Math.min(100, (profile.current_xp / xpForNextLevel) * 100)
  const joinDate = profile.joined_at
    ? new Date(profile.joined_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })
    : null

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.page}>
        {statusMessage && (
          <div className={`${styles.statusMessage} ${statusMessage.type === 'error' ? styles.statusError : styles.statusSuccess}`}>
            {statusMessage.text}
          </div>
        )}

        {/* Profile Header Card */}
        <div className={styles.profileCard}>
          {/* Banner */}
          <div
            className={styles.banner}
            style={profile.banner_url ? { backgroundImage: `url(${getImageUrl(profile.banner_url)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {isOwnProfile && (
              <>
                <button
                  className={styles.bannerEditBtn}
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={bannerUploading}
                >
                  <Camera size={14} /> {bannerUploading ? 'Uploading...' : 'Сменить баннер'}
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) {
                      void uploadBanner(file)
                    }
                    e.currentTarget.value = ''
                  }}
                />
              </>
            )}
          </div>

          <div className={styles.avatarRow}>
            <div className={styles.avatarWrap}>
              {profile.avatar_url ? (
                <img src={getImageUrl(profile.avatar_url) || ''} alt={displayName} className={styles.avatar} />
              ) : (
                <div className={styles.avatarPlaceholder}>{displayName[0]?.toUpperCase()}</div>
              )}
              {isOwnProfile && (
                <>
                  <button className={styles.avatarEditBtn} onClick={() => avatarInputRef.current?.click()} disabled={avatarUploading}>
                    <Camera size={14} />
                  </button>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    style={{ display: 'none' }}
                    onChange={e => {
                      const file = e.target.files?.[0]
                      if (file) {
                        void uploadAvatar(file)
                      }
                      e.currentTarget.value = ''
                    }}
                  />
                </>
              )}
            </div>

            <div className={styles.avatarActions}>
              {isOwnProfile ? (
                <button className={styles.editBtn} onClick={openEdit}><Edit2 size={14} /> Edit profile</button>
              ) : token && (
                <>
                  {friendStatus === 'incoming' ? (
                    <button className={styles.friendBtn} onClick={acceptIncomingRequest} disabled={friendLoading}>
                      <UserPlus size={14} />
                      Accept request
                    </button>
                  ) : friendStatus === 'friends' ? (
                    <button className={styles.friendBtn} onClick={removeFriend} disabled={friendLoading}>
                      <Users size={14} />
                      Remove friend
                    </button>
                  ) : (
                    <button
                      className={`${styles.friendBtn} ${friendStatus === 'pending' ? styles.friendBtnDisabled : ''}`}
                      onClick={sendFriendRequest}
                      disabled={friendLoading || friendStatus === 'pending'}
                    >
                      <UserPlus size={14} />
                      {friendStatus === 'pending' ? 'Request sent' : 'Add friend'}
                    </button>
                  )}
                </>
              )}
              <button className={styles.shareBtn} onClick={copyLink}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied' : 'Share'}
              </button>
            </div>
          </div>

          <div className={styles.profileInfo}>
            <div className={styles.nameRow}>
              <h1 className={styles.name}>{displayName}</h1>
              <span className={styles.levelBadge}><Star size={11} /> {profile.level}</span>
            </div>
            <div className={styles.handleRow}>
              @{profile.discord_username}
              {profile.forest_rank && <span className={styles.rank}> В· {profile.forest_rank}</span>}
              {profile.twitch_username && (
                <a href={`https://twitch.tv/${profile.twitch_username}`} target="_blank" rel="noreferrer" className={styles.twitchLink}>
                  <Twitch size={12} /> {profile.twitch_username}
                </a>
              )}
            </div>
            <div className={styles.statsInline}>
              <span className={styles.statItem}><Trophy size={12} /> РўСѓСЂРЅРёСЂРѕРІ: {profile.tourney_stats?.played ?? 0}</span>
              <span className={styles.statItem}><Star size={12} /> РџРѕР±РµРґ: {profile.tourney_stats?.wins ?? 0}</span>
              <span className={styles.statItem}>Р РµР№С‚РёРЅРі: {profile.rating}</span>
              <span className={styles.statItem}>Очки: {profile.points ?? 0}</span>
              {joinDate && <span className={styles.statItem}><Calendar size={12} /> СЃ {joinDate}</span>}
            </div>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
            {profile.roles && profile.roles.length > 0 && (
              <div className={styles.rolesRow}>
                {profile.roles.map(r => (
                  <span key={r.id} className={styles.roleBadge} style={{ borderColor: r.color, color: r.color }}>{r.name}</span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Two-column layout */}
        <div className={styles.columns}>

          {/* LEFT: tabs + content */}
          <div className={styles.mainCol}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${tab === 'media' ? styles.tabActive : ''}`} onClick={() => setTab('media')}><ImageIcon size={14} /> РњРµРґРёР°</button>
              <button className={`${styles.tab} ${tab === 'stats' ? styles.tabActive : ''}`} onClick={() => setTab('stats')}><BarChart2 size={14} /> РЎС‚Р°С‚РёСЃС‚РёРєР°</button>
              <button className={`${styles.tab} ${tab === 'tournaments' ? styles.tabActive : ''}`} onClick={() => setTab('tournaments')}><Trophy size={14} /> РўСѓСЂРЅРёСЂС‹</button>
              <button className={`${styles.tab} ${tab === 'activity' ? styles.tabActive : ''}`} onClick={() => setTab('activity')}><Activity size={14} /> РђРєС‚РёРІРЅРѕСЃС‚СЊ</button>
              <button className={`${styles.tab} ${tab === 'achievements' ? styles.tabActive : ''}`} onClick={() => setTab('achievements')}><Award size={14} /> Р”РѕСЃС‚РёР¶РµРЅРёСЏ</button>
            </div>

            <div className={styles.tabContent}>
              {tab === 'media' && (
                <div className={styles.mediaGrid}>
                  {mediaLoading && <p className={styles.emptyText}>Loading media...</p>}
                  {!mediaLoading && media.length === 0
                    ? <p className={styles.emptyText}>РќРµС‚ Р·Р°РіСЂСѓР¶РµРЅРЅС‹С… РјРµРґРёР°</p>
                    : media.map(m => (
                      <div key={m.id} className={styles.mediaCard}>
                        {m.media_type === 'image'
                          ? <img src={getImageUrl(m.file_url) || ''} alt={m.title ?? ''} className={styles.mediaThumb} />
                          : <video src={getImageUrl(m.file_url) || ''} className={styles.mediaThumb} muted />}
                        {m.title && <p className={styles.mediaTitle}>{m.title}</p>}
                      </div>
                    ))}
                </div>
              )}

              {tab === 'stats' && (
                <div className={styles.statsPanel}>
                  <h3 className={styles.statsSectionTitle}>РЎС‚Р°С‚РёСЃС‚РёРєР° СЃР°Р№С‚Р°</h3>
                  <div className={styles.statRow}><span>РЈСЂРѕРІРµРЅСЊ</span><strong>{profile.level}</strong></div>
                  <div className={styles.statRow}><span>Р РµР№С‚РёРЅРі</span><strong>{profile.rating}</strong></div>
                  <div className={styles.statRow}><span>РўСѓСЂРЅРёСЂРѕРІ СЃС‹РіСЂР°РЅРѕ</span><strong>{profile.tourney_stats?.played ?? 0}</strong></div>
                  <div className={styles.statRow}><span>РўСѓСЂРЅРёСЂРѕРІ РІС‹РёРіСЂР°РЅРѕ</span><strong>{profile.tourney_stats?.wins ?? 0}</strong></div>
                  <div className={styles.statRow}><span>РћРїС‹С‚</span><strong>{profile.current_xp} / {xpForNextLevel} XP</strong></div>
                  <div className={styles.xpBarInline}><div className={styles.xpFill} style={{ width: `${xpPercent}%` }} /></div>

                  {gameAccounts.length > 0 && (
                    <>
                      <h3 className={styles.statsSectionTitle} style={{ marginTop: '16px' }}>РџСЂРёРІСЏР·Р°РЅРЅС‹Рµ РёРіСЂС‹</h3>
                      {gameAccounts.map(g => (
                        <div key={g.game} className={styles.gameAccountRow}>
                          <span className={styles.gameLabel}>{g.game === 'steam' ? 'Steam' : g.game === 'dota2' ? 'Dota 2' : g.game === 'valorant' ? 'Valorant' : g.game}</span>
                          <span className={styles.gameId}>{g.account_tag ? `${g.account_id}#${g.account_tag}` : g.account_id}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {gameAccounts.length === 0 && (
                    <p className={styles.emptyText} style={{ marginTop: '12px' }}>РќРµС‚ РїСЂРёРІСЏР·Р°РЅРЅС‹С… РёРіСЂРѕРІС‹С… Р°РєРєР°СѓРЅС‚РѕРІ</p>
                  )}
                </div>
              )}

              {tab === 'tournaments' && (
                <div className={styles.sectionList}>
                  {registrationsLoading && <p className={styles.emptyText}>Loading tournaments...</p>}
                  {!registrationsLoading && registrations.length === 0 && (
                    <p className={styles.emptyText}>РўСѓСЂРЅРёСЂС‹ СЃРєРѕСЂРѕ РїРѕСЏРІСЏС‚СЃСЏ</p>
                  )}
                  {!registrationsLoading && registrations.map((registration) => (
                    <div key={`${registration.id}-${registration.registered_at ?? ''}`} className={styles.listCard}>
                      <div className={styles.listCardTitle}>{registration.title}</div>
                      <div className={styles.listCardMeta}>
                        <span>{registration.game || 'Unknown game'}</span>
                        <span>{registration.status}</span>
                        {registration.start_date && <span>{new Date(registration.start_date).toLocaleDateString('ru-RU')}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {tab === 'activity' && (
                <div className={styles.sectionList}>
                  {activityLoading && <p className={styles.emptyText}>Loading activity...</p>}
                  {!activityLoading && !activity && (
                    <p className={styles.emptyText}>РђРєС‚РёРІРЅРѕСЃС‚СЊ СЃРєРѕСЂРѕ РїРѕСЏРІРёС‚СЃСЏ</p>
                  )}
                  {!activityLoading && activity && (
                    <>
                      <div className={styles.statRow}><span>Messages</span><strong>{activity.message_count}</strong></div>
                      <div className={styles.statRow}><span>Voice hours</span><strong>{activity.voice_hours}</strong></div>
                      <div className={styles.subsection}>
                        <h3 className={styles.statsSectionTitle}>Recent messages</h3>
                        {activity.recent_messages.length === 0 && <p className={styles.emptyText}>No recent messages</p>}
                        {activity.recent_messages.map((item, index) => (
                          <div key={`${item.created_at ?? 'msg'}-${index}`} className={styles.listCard}>
                            <div className={styles.listCardMeta}>
                              <span>{item.type || 'message'}</span>
                              <span>{item.channel || 'unknown channel'}</span>
                              {item.created_at && <span>{new Date(item.created_at).toLocaleString('ru-RU')}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className={styles.subsection}>
                        <h3 className={styles.statsSectionTitle}>Recent voice</h3>
                        {activity.recent_voice.length === 0 && <p className={styles.emptyText}>No recent voice sessions</p>}
                        {activity.recent_voice.map((item, index) => (
                          <div key={`${item.joined_at ?? 'voice'}-${index}`} className={styles.listCard}>
                            <div className={styles.listCardMeta}>
                              <span>{item.channel || 'unknown channel'}</span>
                              <span>{item.duration_minutes} min</span>
                              {item.joined_at && <span>{new Date(item.joined_at).toLocaleString('ru-RU')}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {tab === 'achievements' && (
                <div className={styles.achievGrid}>
                  {achievementsLoading && <p className={styles.emptyText}>Loading achievements...</p>}
                  {!achievementsLoading && achievements.length === 0
                    ? <p className={styles.emptyText}>РќРµС‚ РґРѕСЃС‚РёР¶РµРЅРёР№</p>
                    : achievements.map(a => (
                      <div key={a.id} className={styles.achievCard}>
                        <div className={styles.achievIcon}>{a.icon}</div>
                        <div className={styles.achievInfo}>
                          <div className={styles.achievName}>{a.name}</div>
                          <div className={styles.achievDesc}>{a.description}</div>
                        </div>
                        <div className={styles.achievPoints}>+{a.points}</div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: sidebar */}
          <div className={styles.sidebar}>

            {/* Friends block */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}><Users size={14} /> Р”СЂСѓР·СЊСЏ</div>
              <p className={styles.sideCardEmpty}>РЎРїРёСЃРѕРє РґСЂСѓР·РµР№ СЃРєРѕСЂРѕ</p>
            </div>

            {/* Achievements showcase */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <span className={styles.sideCardHeaderLeft}><Award size={14} /> Р”РѕСЃС‚РёР¶РµРЅРёСЏ</span>
                {isOwnProfile && (achievements.length > 0 || showcase.length > 0) && (
                  <button className={styles.sideCardEditBtn} onClick={() => { void openShowcasePicker() }} title="Р’С‹Р±СЂР°С‚СЊ РѕС‚РѕР±СЂР°Р¶Р°РµРјС‹Рµ"><Edit2 size={13} /></button>
                )}
              </div>
              {showcase.length === 0 && achievements.length === 0
                ? <p className={styles.sideCardEmpty}>РќРµС‚ РґРѕСЃС‚РёР¶РµРЅРёР№</p>
                : <div className={styles.achievShowcase}>
                    {((showcase.length > 0
                      ? showcase
                      : achievements.slice(0, 3).map((item) => ({
                          id: item.achievement_type_id,
                          name: item.name,
                          description: item.description,
                          icon: item.icon,
                          points: item.points,
                        })))
                    ).map(a => (
                      <div key={a.id} className={styles.achievBadge} title={a.name}>{a.icon}</div>
                    ))}
                  </div>
              }
            </div>

            {/* Linked accounts */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>РџСЂРёРІСЏР·Р°РЅРЅС‹Рµ Р°РєРєР°СѓРЅС‚С‹</div>
              {profile.twitch_username && (
                <a href={`https://twitch.tv/${profile.twitch_username}`} target="_blank" rel="noreferrer" className={styles.linkedAccount}>
                  <Twitch size={14} /> {profile.twitch_username}
                </a>
              )}
              {gameAccounts.map(g => (
                <div key={g.game} className={styles.linkedAccount}>
                  <span className={styles.gameChip}>{g.game === 'steam' ? 'рџЋ®' : g.game === 'dota2' ? 'вљ”пёЏ' : g.game === 'valorant' ? 'рџ”«' : 'рџ•№пёЏ'}</span>
                  <span>{g.account_tag ? `${g.account_id}#${g.account_tag}` : g.account_id}</span>
                </div>
              ))}
              {!profile.twitch_username && gameAccounts.length === 0 && (
                <p className={styles.sideCardEmpty}>{isOwnProfile ? 'РџСЂРёРІСЏР¶Рё Р°РєРєР°СѓРЅС‚С‹ РІ СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёРё' : 'РќРµС‚ РїСЂРёРІСЏР·Р°РЅРЅС‹С… Р°РєРєР°СѓРЅС‚РѕРІ'}</p>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className={styles.modalOverlay} onClick={() => setEditOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Р РµРґР°РєС‚РёСЂРѕРІР°С‚СЊ РїСЂРѕС„РёР»СЊ</span>
              <button className={styles.modalClose} onClick={() => setEditOpen(false)}><X size={18} /></button>
            </div>

            <label className={styles.fieldLabel}>РќРёРєРЅРµР№Рј</label>
            <input className={styles.fieldInput} value={editNick} onChange={e => setEditNick(e.target.value)} placeholder={profile.discord_username} maxLength={32} />

            <label className={styles.fieldLabel}>Рћ СЃРµР±Рµ</label>
            <textarea className={styles.fieldTextarea} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Р Р°СЃСЃРєР°Р¶Рё Рѕ СЃРµР±Рµ..." maxLength={300} rows={4} />

            <label className={styles.fieldLabel}>Twitch</label>
            <div className={styles.twitchRow}>
              <input className={styles.fieldInput} value={twitchInput} onChange={e => setTwitchInput(e.target.value)} placeholder="twitch_username" />
              <button className={styles.twitchSaveBtn} onClick={saveTwitch} disabled={twitchSaving}>
                {profile.twitch_username && !twitchInput.trim() ? 'РћС‚РІСЏР·Р°С‚СЊ' : 'РЎРѕС…СЂР°РЅРёС‚СЊ'}
              </button>
            </div>

            <label className={styles.hiddenRow}>
              <input type="checkbox" checked={editHidden} onChange={e => setEditHidden(e.target.checked)} />
              РЎРєСЂС‹С‚СЊ РїСЂРѕС„РёР»СЊ
            </label>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setEditOpen(false)}>РћС‚РјРµРЅР°</button>
              <button className={styles.saveBtn} onClick={saveProfile} disabled={editSaving}>РЎРѕС…СЂР°РЅРёС‚СЊ</button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Picker Modal */}
      {achievPickerOpen && (
        <div className={styles.modalOverlay} onClick={() => setAchievPickerOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Р’С‹Р±РµСЂРё РґРѕСЃС‚РёР¶РµРЅРёСЏ РґР»СЏ РїРѕРєР°Р·Р° (РґРѕ 3)</span>
              <button className={styles.modalClose} onClick={() => setAchievPickerOpen(false)}><X size={18} /></button>
            </div>
            <div className={styles.achievPickerGrid}>
              {achievements.map(a => (
                <button
                  key={a.id}
                  className={`${styles.achievPickerItem} ${showcaseSelection.includes(a.achievement_type_id) ? styles.achievPickerSelected : ''}`}
                  onClick={() => toggleShowcaseSelection(a.achievement_type_id)}
                  title={a.name}
                >
                  <span className={styles.achievIcon}>{a.icon}</span>
                  <span className={styles.achievPickerName}>{a.name}</span>
                  {showcaseSelection.includes(a.achievement_type_id) && <Check size={12} className={styles.achievPickerCheck} />}
                </button>
              ))}
            </div>
            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setAchievPickerOpen(false)}>РћС‚РјРµРЅР°</button>
              <button className={styles.saveBtn} onClick={() => void saveShowcase()} disabled={showcaseSaving}>
                {showcaseSaving ? 'Saving...' : 'РЎРѕС…СЂР°РЅРёС‚СЊ'}
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

