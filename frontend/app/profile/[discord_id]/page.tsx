'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import {
  Activity,
  Award,
  BadgeCheck,
  BadgePlus,
  BarChart2,
  Calendar,
  Camera,
  Check,
  ChevronLeft,
  Copy,
  Edit2,
  ExternalLink,
  Gamepad2,
  Image as ImageIcon,
  Link2,
  Shield,
  Sparkles,
  Star,
  Swords,
  Trophy,
  Twitch,
  UserPlus,
  Users,
  X,
} from 'lucide-react'
import { Navigation } from '../../../components/layout/Navigation'
import { Footer } from '../../../components/layout/Footer'
import { getImageUrl } from '../../../lib/imageUtils'
import { uploadImage } from '../../../lib/imageUpload'
import { getAuthIdentityFromToken } from '../../../lib/profileIdentifier'
import styles from './profile.module.css'
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'
type Tab = 'stats' | 'accounts' | 'games' | 'media' | 'tournaments' | 'activity' | 'achievements'
type FriendStatus = 'none' | 'pending' | 'incoming' | 'friends'
type UploadKind = 'avatar' | 'banner' | null
interface Role { id: number; name: string; color: string }
interface GameAccount { game: string; account_id: string; account_tag: string | null }
interface SteamProfile { username: string | null; avatar_url: string | null; profile_url: string | null; status: string | null }
interface CS2Stats {
  kills: number
  deaths: number
  kd_ratio: number
  wins: number
  losses?: number
  matches_played: number
  mvps: number
  headshots: number
  headshot_pct?: number
  win_rate: number
  damage_per_round?: number
}
interface DotaProfile {
  username: string | null
  avatar_url: string | null
  rank_tier: number | null
  leaderboard_rank: number | null
  mmr_estimate: number | null
}
interface DotaStats {
  wins: number
  losses: number
  total_matches: number
  win_rate: number
  average_kd?: number | null
}
interface DotaRecentMatch {
  match_id: number
  hero_id: number | null
  hero_name?: string | null
  kills: number
  deaths: number
  assists: number
  duration: number
  start_time: number | null
  won: boolean
}
interface ValorantProfile { username: string | null; account_level: number | null; card_url: string | null; region: string | null }
interface ValorantMMR { current_tier: string | null; ranking_in_tier: number | null; mmr_change: number | null; elo: number | null; games_needed_for_rating: number }
interface PublicGameStats {
  steam?: { profile: SteamProfile | null; cs2_stats: CS2Stats | null; match_history: Array<Record<string, unknown>> }
  dota2?: { profile: DotaProfile | null; stats: DotaStats | null; match_history: DotaRecentMatch[] }
  valorant?: { profile: ValorantProfile | null; mmr: ValorantMMR | null; match_history: Array<Record<string, unknown>> }
}
interface MediaItem { id: number; title: string | null; media_type: string; file_url: string; created_at: string }
interface Achievement { id: number; name: string; description: string; icon: string; points: number }
interface ActivityItem { type?: string; channel: string | null; created_at?: string | null; joined_at?: string | null; left_at?: string | null; duration_minutes?: number }
interface ActivitySummary {
  message_count: number
  voice_hours: number
  collector_state?: 'active' | 'user_no_data' | 'bot_unavailable' | 'not_linked'
  collector_message?: string | null
  last_presence_sync_at?: string | null
  recent_messages: ActivityItem[]
  recent_voice: ActivityItem[]
}
interface TournamentRegistration {
  id: number
  title: string
  game: string | null
  status: string | null
  start_date: string | null
  prize: string | null
  winner?: string | null
  nickname: string | null
  team_name: string | null
  registered_at: string | null
  final_place?: number | null
  result_note?: string | null
  is_winner?: boolean
  is_in_progress?: boolean
  result_label?: string | null
}
interface FriendItem { id: number; username: string; avatar_url: string | null; forest_rank: string }
interface VerificationRequest {
  id: number
  user_id: number
  twitch_url: string
  telegram_contact: string
  reason: string
  status: 'pending' | 'approved' | 'rejected'
  admin_note?: string | null
  created_at: string
  updated_at: string
  reviewed_at?: string | null
  reviewed_by?: number | null
  reviewed_by_name?: string | null
}
interface PublicProfile {
  user_id: number
  discord_id: number | null
  is_owner?: boolean
  user_tag?: string | null
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
  joined_at: string | null
  tourney_stats: { played: number; wins: number }
  twitch_username: string | null
  is_hidden: boolean
  is_verified?: boolean
  verification_badge?: string | null
  verification_status?: string | null
  roles: Role[]
}
const formatDate = (value?: string | null, mode: 'date' | 'datetime' = 'date') =>
  value ? new Date(value)[mode === 'date' ? 'toLocaleDateString' : 'toLocaleString']('ru-RU') : null
const gameLabel = (game: string) => (game === 'steam' ? 'Steam' : game === 'dota2' ? 'Dota 2' : game === 'valorant' ? 'Valorant' : game)
const gameAccountIcon = (game: string) => {
  if (game === 'steam') return <Gamepad2 size={18} />
  if (game === 'dota2') return <Swords size={18} />
  if (game === 'valorant') return <Sparkles size={18} />
  return <Link2 size={18} />
}
const verificationStatusLabel = (status?: string | null) =>
  status === 'approved' ? 'Верифицирован' : status === 'pending' ? 'На рассмотрении' : status === 'rejected' ? 'Отклонена' : 'Подать заявку'
const formatNumber = (value?: number | null) => (typeof value === 'number' ? value.toLocaleString('ru-RU') : '—')
const formatPercent = (value?: number | null, digits = 1) => (typeof value === 'number' ? `${value.toFixed(digits)}%` : '—')
const formatDotaRank = (rankTier?: number | null, leaderboardRank?: number | null) => {
  if (typeof leaderboardRank === 'number') return `Топ #${leaderboardRank}`
  if (!rankTier) return 'Не определён'
  const medals = ['Рекрут', 'Страж', 'Рыцарь', 'Герой', 'Легенда', 'Властелин', 'Божество', 'Титан']
  const medalIndex = Math.max(0, Math.min(medals.length - 1, Math.floor(rankTier / 10) - 1))
  const stars = rankTier % 10
  return stars > 0 ? `${medals[medalIndex]} ${stars}` : medals[medalIndex]
}
export default function PublicProfilePage() {
  const { discord_id } = useParams<{ discord_id: string }>()
  const router = useRouter()
  const profileIdentifier = useMemo(() => {
    const raw = String(discord_id ?? '').trim()
    try { return decodeURIComponent(raw) } catch { return raw }
  }, [discord_id])
  const encodedProfileIdentifier = encodeURIComponent(profileIdentifier)
  const [token, setToken] = useState<string | null>(null)
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('stats')
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('none')
  const [friendLoading, setFriendLoading] = useState(false)
  const [uploading, setUploading] = useState<UploadKind>(null)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [media, setMedia] = useState<MediaItem[]>([])
  const [achievements, setAchievements] = useState<Achievement[]>([])
  const [showcase, setShowcase] = useState<Achievement[]>([])
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([])
  const [accounts, setAccounts] = useState<GameAccount[]>([])
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [gameStats, setGameStats] = useState<PublicGameStats | null>(null)
  const [loaded, setLoaded] = useState<Record<string, boolean>>({})
  const [editOpen, setEditOpen] = useState(false)
  const [achievementsOpen, setAchievementsOpen] = useState(false)
  const [verificationOpen, setVerificationOpen] = useState(false)
  const [verificationRequest, setVerificationRequest] = useState<VerificationRequest | null>(null)
  const [verificationSaving, setVerificationSaving] = useState(false)
  const [verificationTwitch, setVerificationTwitch] = useState('')
  const [verificationTelegram, setVerificationTelegram] = useState('')
  const [verificationReason, setVerificationReason] = useState('')
  const [editNick, setEditNick] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editHidden, setEditHidden] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [twitchInput, setTwitchInput] = useState('')
  const [twitchSaving, setTwitchSaving] = useState(false)
  const [showcaseIds, setShowcaseIds] = useState<number[]>([])
  const [showcaseSaving, setShowcaseSaving] = useState(false)
  const [unlinkingGame, setUnlinkingGame] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)
  const tabsRef = useRef<HTMLDivElement>(null)
  const tabRefs = useRef<Partial<Record<Tab, HTMLButtonElement | null>>>({})
  const authIdentity = getAuthIdentityFromToken(token)
  const isOwnProfile = Boolean(
    profile?.is_owner ||
    (authIdentity.userId && profile?.user_id && authIdentity.userId === String(profile.user_id)) ||
    (authIdentity.discordId && profile?.discord_id && authIdentity.discordId === String(profile.discord_id)) ||
    (authIdentity.userTag && profile?.user_tag && authIdentity.userTag === profile.user_tag),
  )
  const displayName = profile?.site_nickname || profile?.discord_username || 'Профиль'
  const publicIdentifier = profile?.user_tag || profile?.discord_id || profile?.user_id || profileIdentifier
  const sharePath = `/profile/${encodeURIComponent(String(publicIdentifier))}`
  const shareUrl = typeof window === 'undefined' ? sharePath : `${window.location.origin}${sharePath}`
  const xpPercent = profile ? Math.min(100, (profile.current_xp / Math.max(1, profile.level * 100)) * 100) : 0
  const showcaseItems = showcase.length ? showcase : achievements.slice(0, 3)
  const setSuccess = (text: string) => setToast({ type: 'success', text })
  const setFailure = (text: string) => setToast({ type: 'error', text })
  function mergeProfileUpdate(nextProfile: PublicProfile, previousProfile: PublicProfile): PublicProfile {
    return {
      ...previousProfile,
      ...nextProfile,
      is_owner: previousProfile.is_owner || nextProfile.is_owner || true,
      user_tag: nextProfile.user_tag ?? previousProfile.user_tag ?? null,
      discord_id: nextProfile.discord_id ?? previousProfile.discord_id,
    }
  }
  useEffect(() => {
    const savedToken = localStorage.getItem(TOKEN_KEY)
    setToken(savedToken)
    setLoading(true)
    setError(null)
    setProfile(null)
    setLoaded({})
    setMedia([])
    setAchievements([])
    setShowcase([])
    setActivity(null)
    setRegistrations([])
    setAccounts([])
    setFriends([])
    setGameStats(null)
    void loadProfile(savedToken)
  }, [profileIdentifier])
  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 3200)
    return () => window.clearTimeout(id)
  }, [toast])
  useEffect(() => {
    if (!profile) return
    void loadLinkedAccounts()
    void axios.get<FriendItem[]>(`${API_URL}/api/friends/public/${encodedProfileIdentifier}`).then((r) => setFriends(r.data)).catch(() => setFriends([]))
    void axios.get<Achievement[]>(`${API_URL}/api/achievements/showcase/${encodedProfileIdentifier}`).then((r) => {
      setShowcase(r.data)
      setShowcaseIds(r.data.map((item) => item.id))
    }).catch(() => {
      setShowcase([])
      setShowcaseIds([])
    })
    if (token && !isOwnProfile) {
      void axios.get(`${API_URL}/api/friends/status/${encodedProfileIdentifier}`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => setFriendStatus(r.data.status)).catch(() => setFriendStatus('none'))
    }
    if (token && isOwnProfile) {
      void axios.get<VerificationRequest | null>(`${API_URL}/api/profile/verification-request`, { headers: { Authorization: `Bearer ${token}` } }).then((r) => setVerificationRequest(r.data)).catch(() => setVerificationRequest(null))
    }
  }, [profile, token, encodedProfileIdentifier, isOwnProfile])
  useEffect(() => {
    if (!profile) return
    if (tab === 'media') void loadOnce('media', () => axios.get<MediaItem[]>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}/media`).then((r) => r.data), setMedia)
    if (tab === 'achievements') void loadOnce('achievements', () => axios.get<Achievement[]>(`${API_URL}/api/achievements/user/${encodedProfileIdentifier}?completed_only=true`).then((r) => r.data), setAchievements)
    if (tab === 'activity') void loadOnce('activity', () => axios.get<ActivitySummary>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}/activity`).then((r) => r.data), setActivity)
    if (tab === 'tournaments') void loadOnce('tournaments', () => axios.get<TournamentRegistration[]>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}/registrations`).then((r) => r.data), setRegistrations)
    if (tab === 'games') void loadOnce('games', () => axios.get<PublicGameStats>(`${API_URL}/api/game-stats/public/${encodedProfileIdentifier}/stats`).then((r) => r.data), setGameStats)
  }, [tab, profile, encodedProfileIdentifier])
  useEffect(() => {
    const activeTab = tabRefs.current[tab]
    if (!activeTab) return
    activeTab.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
  }, [tab])
  async function loadProfile(currentToken?: string | null) {
    try {
      const headers = currentToken ? { Authorization: `Bearer ${currentToken}` } : {}
      const res = await axios.get<PublicProfile>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}`, { headers })
      setProfile(res.data)
    } catch (err: any) {
      const status = err.response?.status
      setError(status === 404 ? 'Профиль не найден' : status === 403 ? 'Профиль скрыт владельцем' : 'Не удалось загрузить профиль')
    } finally {
      setLoading(false)
    }
  }
  async function loadOnce<T>(key: string, loader: () => Promise<T>, setter: (value: T) => void) {
    if (loaded[key]) return
    try {
      const value = await loader()
      setter(value)
      setLoaded((prev) => ({ ...prev, [key]: true }))
    } catch {
      setter([] as T)
    }
  }
  function openEdit() {
    if (!profile) return
    setEditNick(profile.site_nickname ?? '')
    setEditBio(profile.bio ?? '')
    setEditHidden(profile.is_hidden ?? false)
    setTwitchInput(profile.twitch_username ?? '')
    setEditOpen(true)
  }
  function openVerificationModal() {
    setVerificationTwitch(verificationRequest?.twitch_url || (profile?.twitch_username ? `https://twitch.tv/${profile.twitch_username}` : ''))
    setVerificationTelegram(verificationRequest?.telegram_contact || '')
    setVerificationReason(verificationRequest?.reason || '')
    setVerificationOpen(true)
  }
  async function saveProfile() {
    if (!token) return
    setEditSaving(true)
    try {
      const res = await axios.put<PublicProfile>(`${API_URL}/api/profile`, { site_nickname: editNick || null, bio: editBio || null, is_hidden: editHidden }, { headers: { Authorization: `Bearer ${token}` } })
      setProfile((prev) => prev ? mergeProfileUpdate(res.data, prev) : prev)
      setEditOpen(false)
      setSuccess('Профиль сохранен.')
    } catch {
      setFailure('Не удалось сохранить профиль.')
    } finally {
      setEditSaving(false)
    }
  }
  async function saveTwitch() {
    if (!token) return
    setTwitchSaving(true)
    try {
      if (twitchInput.trim()) {
        await axios.post(`${API_URL}/api/profile/twitch?twitch_username=${encodeURIComponent(twitchInput.trim())}`, {}, { headers: { Authorization: `Bearer ${token}` } })
        setProfile((prev) => prev ? { ...prev, twitch_username: twitchInput.trim() } : prev)
      } else {
        await axios.delete(`${API_URL}/api/profile/twitch`, { headers: { Authorization: `Bearer ${token}` } })
        setProfile((prev) => prev ? { ...prev, twitch_username: null } : prev)
      }
      setSuccess('Twitch обновлен.')
    } catch {
      setFailure('Не удалось обновить Twitch.')
    } finally {
      setTwitchSaving(false)
    }
  }
  async function submitVerificationRequest() {
    if (!token) return
    setVerificationSaving(true)
    try {
      const { data } = await axios.post<VerificationRequest>(
        `${API_URL}/api/profile/verification-request`,
        {
          twitch_url: verificationTwitch,
          telegram_contact: verificationTelegram,
          reason: verificationReason,
        },
        { headers: { Authorization: `Bearer ${token}` } },
      )
      setVerificationRequest(data)
      setProfile((prev) => prev ? { ...prev, verification_status: data.status } : prev)
      setVerificationOpen(false)
      setSuccess('Заявка на верификацию отправлена.')
    } catch (error: any) {
      setFailure(error.response?.data?.detail || 'Не удалось отправить заявку.')
    } finally {
      setVerificationSaving(false)
    }
  }
  async function updateFile(kind: 'avatar' | 'banner', file: File) {
    if (!token) return
    const formData = new FormData()
    formData.append('file', file)
    setUploading(kind)
    try {
      const res = await axios.post<{ avatar_url?: string; banner_url?: string }>(`${API_URL}/api/profile/${kind}`, formData, { headers: { Authorization: `Bearer ${token}` } })
      setProfile((prev) => prev ? { ...prev, ...(kind === 'avatar' ? { avatar_url: res.data.avatar_url ?? prev.avatar_url } : { banner_url: res.data.banner_url ?? prev.banner_url }) } : prev)
      setSuccess(kind === 'avatar' ? 'Аватар обновлен.' : 'Баннер обновлен.')
    } catch (error: any) {
      try {
        const fallbackUpload = await uploadImage(file)
        if (!fallbackUpload.success || !fallbackUpload.url) {
          throw new Error(fallbackUpload.error || 'Не удалось загрузить изображение')
        }
        const uploadedUrl = fallbackUpload.url

        const payload = kind === 'avatar'
          ? { avatar_url: uploadedUrl }
          : { banner_url: uploadedUrl }

        const { data } = await axios.put<PublicProfile>(
          `${API_URL}/api/profile`,
          payload,
          { headers: { Authorization: `Bearer ${token}` } },
        )

        setProfile((prev) => prev ? {
          ...mergeProfileUpdate(data, prev),
          ...(kind === 'avatar' ? { avatar_url: uploadedUrl } : { banner_url: uploadedUrl }),
        } : prev)
        setSuccess(kind === 'avatar' ? 'Аватар обновлен.' : 'Баннер обновлен.')
      } catch (fallbackError: any) {
        setFailure(
          fallbackError?.response?.data?.detail ||
          fallbackError?.message ||
          error.response?.data?.detail ||
          (kind === 'avatar' ? 'Не удалось загрузить аватар.' : 'Не удалось загрузить баннер.')
        )
      }
    } finally {
      setUploading(null)
      if (kind === 'avatar' && avatarInputRef.current) avatarInputRef.current.value = ''
      if (kind === 'banner' && bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }
  async function loadLinkedAccounts() {
    try {
      const res = await axios.get<GameAccount[]>(`${API_URL}/api/game-stats/public/${encodedProfileIdentifier}/accounts`)
      setAccounts(res.data)
    } catch {
      setAccounts([])
    }
  }
  function handleFileSelection(kind: 'avatar' | 'banner', event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0]
    if (!selectedFile) return
    void updateFile(kind, selectedFile)
  }
  async function copyLink() {
    try {
      if (navigator.share) {
        await navigator.share({ title: `${displayName} | Lesnaya Komanda`, text: `Профиль игрока ${displayName}`, url: shareUrl })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setFailure('Не удалось поделиться ссылкой на профиль.')
    }
  }
  async function sendFriendRequest() {
    if (!token || isOwnProfile) return
    setFriendLoading(true)
    try {
      const res = await axios.post<{ status: 'sent' | 'accepted' }>(`${API_URL}/api/friends/request/${encodedProfileIdentifier}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setFriendStatus(res.data.status === 'accepted' ? 'friends' : 'pending')
      setSuccess(res.data.status === 'accepted' ? 'Пользователь добавлен в друзья.' : 'Заявка в друзья отправлена.')
    } catch {
      setFailure('Не удалось отправить заявку в друзья.')
    } finally {
      setFriendLoading(false)
    }
  }
  function toggleShowcase(id: number) {
    setShowcaseIds((prev) => prev.includes(id) ? prev.filter((item) => item !== id) : [...prev.slice(-2), id])
  }
  async function saveShowcase() {
    if (!token) return
    setShowcaseSaving(true)
    try {
      await axios.put(`${API_URL}/api/achievements/showcase`, { achievement_ids: showcaseIds }, { headers: { Authorization: `Bearer ${token}` } })
      setShowcase(achievements.filter((item) => showcaseIds.includes(item.id)))
      setAchievementsOpen(false)
      setSuccess('Витрина достижений обновлена.')
    } catch {
      setFailure('Не удалось обновить витрину достижений.')
    } finally {
      setShowcaseSaving(false)
    }
  }
  async function unlinkGameAccount(game: string) {
    if (!token) return
    setUnlinkingGame(game)
    try {
      await axios.delete(`${API_URL}/api/game-stats/${game}`, { headers: { Authorization: `Bearer ${token}` } })
      setAccounts((prev) => prev.filter((account) => account.game !== game))
      setGameStats((prev) => {
        if (!prev) return prev
        const next = { ...prev }
        delete next[game as keyof PublicGameStats]
        return next
      })
      setLoaded((prev) => ({ ...prev, games: false }))
      setSuccess(`${gameLabel(game)} отвязан.`)
    } catch {
      setFailure(`Не удалось отвязать ${gameLabel(game)}.`)
    } finally {
      setUnlinkingGame(null)
    }
  }
  function formatDuration(seconds?: number | null) {
    if (!seconds || seconds <= 0) return '0 мин'
    const totalMinutes = Math.round(seconds / 60)
    const hours = Math.floor(totalMinutes / 60)
    const minutes = totalMinutes % 60
    return hours > 0 ? `${hours} ч ${minutes} мин` : `${minutes} мин`
  }
  const tabs: Array<{ id: Tab; icon: React.ReactNode; label: string }> = [
    { id: 'stats', icon: <BarChart2 size={14} />, label: 'Информация' },
    { id: 'accounts', icon: <Link2 size={14} />, label: 'Привязки' },
    { id: 'games', icon: <Gamepad2 size={14} />, label: 'Статистика игр' },
    { id: 'media', icon: <ImageIcon size={14} />, label: 'Медиа' },
    { id: 'tournaments', icon: <Trophy size={14} />, label: 'Турниры' },
    { id: 'activity', icon: <Activity size={14} />, label: 'Активность' },
    { id: 'achievements', icon: <Award size={14} />, label: 'Достижения' },
  ]
  if (loading) return <><Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} /><div className={styles.loadingPage}><div className={styles.spinner} /></div></>
  if (error || !profile) return <><Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} /><div className={styles.errorPage}><h2>{error || 'Профиль не найден'}</h2><button onClick={() => router.push('/')} className={styles.backBtn}><ChevronLeft size={16} />На главную</button></div></>
  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <main className={styles.page}>
        {toast && <div className={`${styles.statusMessage} ${toast.type === 'success' ? styles.statusSuccess : styles.statusError}`}>{toast.text}</div>}
        <section className={styles.hero}>
          <div className={styles.banner} style={profile.banner_url ? { backgroundImage: `linear-gradient(180deg, rgba(12, 8, 22, 0.28), rgba(12, 8, 22, 0.84)), url(${getImageUrl(profile.banner_url)})` } : undefined}>
            <div className={styles.bannerGlow} />
          </div>
          <div className={styles.heroBody}>
            <div className={styles.identity}>
              <div className={styles.avatarWrap}>
                {profile.avatar_url ? <img src={getImageUrl(profile.avatar_url) || ''} alt={displayName} className={styles.avatar} /> : <div className={styles.avatarPlaceholder}>{displayName.charAt(0).toUpperCase()}</div>}
              </div>
              <div className={styles.headingBlock}>
                <div className={styles.titleRow}>
                  <h1 className={styles.name}>{displayName}</h1>
                  <span className={styles.levelBadge}><Star size={12} />Уровень {profile.level}</span>
                  {profile.is_verified && <span className={styles.verifiedBadge}><BadgeCheck size={13} />{profile.verification_badge || 'Верифицирован'}</span>}
                  {profile.is_hidden && isOwnProfile && <span className={styles.hiddenBadge}><Shield size={12} />Профиль скрыт</span>}
                </div>
                <div className={styles.handleRow}>
                  <span>@{profile.discord_username}</span>
                  {profile.forest_rank && <span className={styles.metaPill}>{profile.forest_rank}</span>}
                  <span className={styles.metaPill}>ID: {String(publicIdentifier)}</span>
                  {profile.joined_at && <span className={styles.metaPill}><Calendar size={12} />На сайте с {new Date(profile.joined_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })}</span>}
                </div>
                <p className={styles.bio}>{profile.bio?.trim() || 'Пока без описания. Здесь можно рассказать о себе, стиле игры и целях.'}</p>
                {profile.roles.length > 0 && <div className={styles.rolesRow}>{profile.roles.map((role) => <span key={role.id} className={styles.roleBadge} style={{ borderColor: role.color, color: role.color }}>{role.name}</span>)}</div>}
              </div>
            </div>
            <div className={styles.actions}>
              {isOwnProfile ? (
                <button className={styles.primaryBtn} onClick={openEdit}><Edit2 size={14} />Редактировать профиль</button>
              ) : token ? (
                <button className={`${styles.primaryBtn} ${friendStatus === 'friends' || friendStatus === 'pending' ? styles.primaryBtnMuted : ''}`} onClick={sendFriendRequest} disabled={friendLoading || friendStatus === 'friends' || friendStatus === 'pending'}>
                  <UserPlus size={14} />
                  {friendStatus === 'friends' ? 'Вы уже друзья' : friendStatus === 'pending' ? 'Заявка отправлена' : friendStatus === 'incoming' ? 'Принять заявку' : 'Добавить в друзья'}
                </button>
              ) : null}
              <button className={styles.secondaryBtn} onClick={copyLink}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Ссылка скопирована' : 'Поделиться профилем'}</button>
            </div>
          </div>
          <div className={styles.overviewGrid}>
            <div className={styles.overviewCard}><div className={styles.overviewLabel}>Рейтинг</div><div className={styles.overviewValue}>{profile.rating}</div></div>
            <div className={styles.overviewCard}><div className={styles.overviewLabel}>Турниров сыграно</div><div className={styles.overviewValue}>{profile.tourney_stats?.played ?? 0}</div></div>
            <div className={styles.overviewCard}><div className={styles.overviewLabel}>Побед</div><div className={styles.overviewValue}>{profile.tourney_stats?.wins ?? 0}</div></div>
            <div className={styles.overviewCard}><div className={styles.overviewLabel}>Прогресс уровня</div><div className={styles.progressMeta}><span>{profile.current_xp} / {profile.level * 100} XP</span><span>{Math.round(xpPercent)}%</span></div><div className={styles.progressBar}><div className={styles.progressFill} style={{ width: `${xpPercent}%` }} /></div></div>
          </div>
        </section>
        <section className={styles.contentGrid}>
          <div className={styles.mainColumn}>
            <div className={styles.tabs} ref={tabsRef}>{tabs.map((item) => <button key={item.id} ref={(node) => { tabRefs.current[item.id] = node }} className={`${styles.tab} ${tab === item.id ? styles.tabActive : ''}`} onClick={() => setTab(item.id)}>{item.icon}<span>{item.label}</span></button>)}</div>
            <div className={styles.tabPanel}>
              {tab === 'stats' && <div className={styles.sectionStack}><div className={styles.panelCard}><div className={styles.panelHeader}><h3>Основные данные</h3></div><div className={styles.infoGrid}><div className={styles.infoRow}><span>Никнейм на сайте</span><strong>{profile.site_nickname || 'Не указан'}</strong></div><div className={styles.infoRow}><span>Discord</span><strong>@{profile.discord_username}</strong></div><div className={styles.infoRow}><span>Ранг Лесной Команды</span><strong>{profile.forest_rank || 'Не назначен'}</strong></div><div className={styles.infoRow}><span>Общий опыт</span><strong>{profile.total_xp} XP</strong></div></div></div></div>}
              {tab === 'accounts' && <div className={styles.sectionStack}><div className={styles.panelCard}><div className={styles.panelHeader}><h3>Привязанные аккаунты</h3></div>{profile.twitch_username || accounts.length > 0 ? <div className={styles.accountList}>{profile.twitch_username && <a href={`https://twitch.tv/${profile.twitch_username}`} target="_blank" rel="noreferrer" className={styles.accountCard}><span className={`${styles.accountIcon} ${styles.accountIconTwitch}`}><Twitch size={18} /></span><div className={styles.accountMeta}><strong>Twitch</strong><span>{profile.twitch_username}</span></div><span className={styles.accountExternal}><ExternalLink size={14} /></span></a>}{accounts.map((account) => <div key={`${account.game}-${account.account_id}`} className={styles.accountCard}><span className={`${styles.accountIcon} ${styles[`accountIcon${gameLabel(account.game).replace(/[^a-zA-Z0-9]/g, '')}`] || ''}`}>{gameAccountIcon(account.game)}</span><div className={styles.accountMeta}><strong>{gameLabel(account.game)}</strong><span>{account.account_tag ? `${account.account_id}#${account.account_tag}` : account.account_id}</span></div>{isOwnProfile && <button className={styles.accountDetachBtn} onClick={() => unlinkGameAccount(account.game)} disabled={unlinkingGame === account.game}>{unlinkingGame === account.game ? 'Отвязка...' : 'Отвязать'}</button>}</div>)}</div> : <p className={styles.emptyText}>{isOwnProfile ? 'Подключи игровые аккаунты и Twitch в настройках профиля.' : 'Привязанные аккаунты пока не указаны.'}</p>}{isOwnProfile && accounts.length > 0 && <div className={styles.accountHint}>Игровые аккаунты можно отвязать здесь, а Twitch редактируется в модалке профиля.</div>}</div></div>}
              {tab === 'games' && <div className={styles.sectionStack}>
                {!gameStats || Object.keys(gameStats).length === 0 ? <p className={styles.emptyText}>Игровая статистика пока недоступна. Сначала нужно привязать игровые аккаунты.</p> : <div className={styles.gameCards}>
                  {gameStats.steam?.cs2_stats && <article className={styles.gameCard}>
                    <div className={styles.gameCardHeader}>
                      <div>
                        <div className={styles.gameCardEyebrow}>Counter-Strike 2</div>
                        <h3 className={styles.gameCardTitle}>{gameStats.steam.profile?.username || 'Steam аккаунт'}</h3>
                        <div className={styles.gameCardSubtext}>Источник: Steam API</div>
                      </div>
                      {gameStats.steam.profile?.profile_url && <a href={gameStats.steam.profile.profile_url} target="_blank" rel="noreferrer" className={styles.gameCardLink}>Steam профиль</a>}
                    </div>
                    <div className={styles.gameMetricsGrid}>
                      <div className={styles.gameMetric}><span>K/D</span><strong>{gameStats.steam.cs2_stats.kd_ratio?.toFixed(2) || '0.00'}</strong></div>
                      <div className={styles.gameMetric}><span>Винрейт</span><strong>{formatPercent(gameStats.steam.cs2_stats.win_rate)}</strong></div>
                      <div className={styles.gameMetric}><span>Матчей</span><strong>{formatNumber(gameStats.steam.cs2_stats.matches_played)}</strong></div>
                      <div className={styles.gameMetric}><span>Побед / поражений</span><strong>{formatNumber(gameStats.steam.cs2_stats.wins)} / {formatNumber(gameStats.steam.cs2_stats.losses)}</strong></div>
                      <div className={styles.gameMetric}><span>Убийств</span><strong>{formatNumber(gameStats.steam.cs2_stats.kills)}</strong></div>
                      <div className={styles.gameMetric}><span>Смертей</span><strong>{formatNumber(gameStats.steam.cs2_stats.deaths)}</strong></div>
                      <div className={styles.gameMetric}><span>Хедшоты</span><strong>{formatPercent(gameStats.steam.cs2_stats.headshot_pct)}</strong></div>
                      <div className={styles.gameMetric}><span>MVP</span><strong>{formatNumber(gameStats.steam.cs2_stats.mvps)}</strong></div>
                    </div>
                    <div className={styles.gameHint}>История матчей CS2 пока недоступна через текущий API-источник.</div>
                  </article>}
                  {gameStats.dota2 && <article className={styles.gameCard}>
                    <div className={styles.gameCardHeader}>
                      <div>
                        <div className={styles.gameCardEyebrow}>Dota 2</div>
                        <h3 className={styles.gameCardTitle}>{gameStats.dota2.profile?.username || 'Dota 2 аккаунт'}</h3>
                        <div className={styles.gameCardSubtext}>Матчи: Steam API · Ранг и MMR: OpenDota</div>
                      </div>
                      <div className={styles.gameCardBadge}>{gameStats.dota2.profile?.mmr_estimate ? `MMR ~${gameStats.dota2.profile.mmr_estimate}` : 'MMR скрыт'}</div>
                    </div>
                    <div className={styles.gameMetricsGrid}>
                      <div className={styles.gameMetric}><span>K/D</span><strong>{gameStats.dota2.stats?.average_kd?.toFixed(2) || '0.00'}</strong></div>
                      <div className={styles.gameMetric}><span>Рейтинг</span><strong>{formatDotaRank(gameStats.dota2.profile?.rank_tier, gameStats.dota2.profile?.leaderboard_rank)}</strong></div>
                      <div className={styles.gameMetric}><span>Матчей</span><strong>{formatNumber(gameStats.dota2.stats?.total_matches)}</strong></div>
                      <div className={styles.gameMetric}><span>Побед / поражений</span><strong>{formatNumber(gameStats.dota2.stats?.wins)} / {formatNumber(gameStats.dota2.stats?.losses)}</strong></div>
                      <div className={styles.gameMetric}><span>Винрейт</span><strong>{formatPercent(gameStats.dota2.stats?.win_rate)}</strong></div>
                    </div>
                    {gameStats.dota2.match_history?.length ? <><div className={styles.gameSectionTitle}>Последние матчи</div><div className={styles.matchHistoryList}>{gameStats.dota2.match_history.map((match) => <div key={match.match_id} className={styles.matchHistoryItem}>
                      <div className={styles.matchHistoryTop}><strong>{match.won ? 'Победа' : 'Поражение'}</strong><span className={`${styles.matchResult} ${match.won ? styles.matchResultWin : styles.matchResultLoss}`}>{match.kills}/{match.deaths}/{match.assists}</span></div>
                      <div className={styles.matchHistoryMeta}><span>Матч #{match.match_id}</span><span>Герой: {match.hero_name || (match.hero_id ? `#${match.hero_id}` : '—')}</span><span>{formatDuration(match.duration)}</span>{match.start_time ? <span>{new Date(match.start_time * 1000).toLocaleDateString('ru-RU')}</span> : null}</div>
                    </div>)}</div></> : <div className={styles.gameHint}>История матчей Dota 2 пока пуста.</div>}
                  </article>}
                  {gameStats.valorant && <article className={styles.gameCard}>
                    <div className={styles.gameCardHeader}>
                      <div>
                        <div className={styles.gameCardEyebrow}>Valorant</div>
                        <h3 className={styles.gameCardTitle}>{gameStats.valorant.profile?.username || 'Valorant аккаунт'}</h3>
                        <div className={styles.gameCardSubtext}>Источник: Henrik / Riot data</div>
                      </div>
                      <div className={styles.gameCardBadge}>{gameStats.valorant.mmr?.current_tier || 'Unranked'}</div>
                    </div>
                    <div className={styles.gameMetricsGrid}>
                      <div className={styles.gameMetric}><span>K/D</span><strong>Нет данных</strong></div>
                      <div className={styles.gameMetric}><span>Рейтинг</span><strong>{gameStats.valorant.mmr?.elo || gameStats.valorant.mmr?.ranking_in_tier || 'Нет'}</strong></div>
                      <div className={styles.gameMetric}><span>Матчей</span><strong>{gameStats.valorant.mmr?.games_needed_for_rating ? `Калибровка: ${gameStats.valorant.mmr.games_needed_for_rating}` : 'Нет данных'}</strong></div>
                      <div className={styles.gameMetric}><span>Побед / поражений</span><strong>Нет данных</strong></div>
                    </div>
                    <div className={styles.gameHint}>Текущий источник Valorant отдает рейтинг и MMR, но не возвращает публичную историю матчей и W/L.</div>
                  </article>}
                </div>}
              </div>}
              {tab === 'media' && <div className={styles.sectionStack}>{media.length === 0 ? <p className={styles.emptyText}>У пользователя пока нет опубликованных медиа.</p> : <div className={styles.mediaGrid}>{media.map((item) => <article key={item.id} className={styles.mediaCard}>{item.media_type === 'image' ? <img src={getImageUrl(item.file_url) || ''} alt={item.title || 'Медиа'} className={styles.mediaThumb} /> : <video src={getImageUrl(item.file_url) || ''} className={styles.mediaThumb} muted controls={false} />}<div className={styles.mediaBody}><div className={styles.mediaTitle}>{item.title || 'Без названия'}</div><div className={styles.mediaMeta}>{formatDate(item.created_at) || 'Дата неизвестна'}</div></div></article>)}</div>}</div>}
              {tab === 'tournaments' && <div className={styles.sectionStack}>{registrations.length === 0 ? <p className={styles.emptyText}>Пока нет записей на турниры.</p> : registrations.map((item) => <article key={`${item.id}-${item.registered_at ?? 'registration'}`} className={`${styles.listCard} ${item.is_winner ? styles.tournamentWinnerCard : ''}`}><div className={styles.listCardTitle}>{item.title}</div><div className={styles.listCardMeta}>{item.game && <span>{item.game}</span>}{item.team_name && <span>Команда: {item.team_name}</span>}{item.nickname && <span>Ник: {item.nickname}</span>}{item.start_date && <span>Старт: {formatDate(item.start_date)}</span>}{item.prize && <span>Приз: {item.prize}</span>}</div><div className={styles.tournamentResultRow}><span className={`${styles.tournamentStatusBadge} ${item.is_winner ? styles.tournamentStatusWinner : item.is_in_progress ? styles.tournamentStatusLive : styles.tournamentStatusDone}`}>{item.result_label || (item.is_in_progress ? 'Турнир еще идет' : 'Турнир завершен')}</span>{item.is_winner && <span className={styles.tournamentWinnerText}>🏆 Игрок выиграл этот турнир</span>}</div></article>)}</div>}
              {tab === 'activity' && <div className={styles.sectionStack}>{activity?.collector_state && activity.collector_state !== 'active' && activity.collector_message ? <div className={`${styles.statusNotice} ${activity.collector_state === 'bot_unavailable' ? styles.statusNoticeWarning : ''}`}><strong>{activity.collector_state === 'bot_unavailable' ? 'Статистика Discord недоступна.' : 'Статистика пока пуста.'}</strong><span>{activity.collector_message}</span>{activity.last_presence_sync_at && <span>Последняя синхронизация presence: {formatDate(activity.last_presence_sync_at, 'datetime')}</span>}</div> : null}<div className={styles.activityOverview}><div className={styles.metricCard}><span>Сообщений</span><strong>{activity?.message_count ?? 0}</strong></div><div className={styles.metricCard}><span>Голосовых часов</span><strong>{activity?.voice_hours ?? 0}</strong></div></div><div className={styles.panelCard}><div className={styles.panelHeader}><h3>Последние сообщения</h3></div>{activity?.recent_messages?.length ? <div className={styles.sectionStack}>{activity.recent_messages.map((item, index) => <article key={`${item.created_at ?? index}-${item.channel ?? 'message'}`} className={styles.listCard}><div className={styles.listCardTitle}>{item.channel || 'Без канала'}</div><div className={styles.listCardMeta}>{item.type && <span>Тип: {item.type}</span>}{formatDate(item.created_at, 'datetime') && <span>{formatDate(item.created_at, 'datetime')}</span>}</div></article>)}</div> : <p className={styles.emptyText}>Нет данных по сообщениям.</p>}</div><div className={styles.panelCard}><div className={styles.panelHeader}><h3>Последние голосовые сессии</h3></div>{activity?.recent_voice?.length ? <div className={styles.sectionStack}>{activity.recent_voice.map((item, index) => <article key={`${item.joined_at ?? index}-${item.channel ?? 'voice'}`} className={styles.listCard}><div className={styles.listCardTitle}>{item.channel || 'Без канала'}</div><div className={styles.listCardMeta}>{formatDate(item.joined_at, 'datetime') && <span>Начало: {formatDate(item.joined_at, 'datetime')}</span>}{formatDate(item.left_at, 'datetime') && <span>Конец: {formatDate(item.left_at, 'datetime')}</span>}{typeof item.duration_minutes === 'number' && <span>Длительность: {item.duration_minutes} мин.</span>}</div></article>)}</div> : <p className={styles.emptyText}>Нет данных по голосовой активности.</p>}</div></div>}
              {tab === 'achievements' && <div className={styles.sectionStack}>{achievements.length === 0 ? <p className={styles.emptyText}>Достижения пока не открыты.</p> : <div className={styles.achievementGrid}>{achievements.map((item) => <article key={item.id} className={styles.achievementCard}><div className={styles.achievementIcon}>{item.icon}</div><div className={styles.achievementInfo}><div className={styles.achievementName}>{item.name}</div><div className={styles.achievementDescription}>{item.description}</div></div><div className={styles.achievementPoints}>+{item.points}</div></article>)}</div>}</div>}
            </div>
          </div>
          <aside className={styles.sidebar}>
            <div className={styles.sideCard}><div className={styles.sideCardHeader}><span className={styles.sideCardTitle}><Award size={14} />Витрина достижений</span>{isOwnProfile && <button className={styles.sideActionBtn} onClick={() => { void loadOnce('achievements', () => axios.get<Achievement[]>(`${API_URL}/api/achievements/user/${encodedProfileIdentifier}?completed_only=true`).then((r) => r.data), setAchievements); setAchievementsOpen(true) }} title="Редактировать витрину достижений" aria-label="Редактировать витрину достижений"><Edit2 size={14} /></button>}</div>{showcaseItems.length === 0 ? <p className={styles.sideEmpty}>Выбранных достижений пока нет.</p> : <div className={styles.showcaseGrid}>{showcaseItems.map((item) => <div key={item.id} className={styles.showcaseBadge} title={item.name}><span className={styles.showcaseIcon}>{item.icon}</span><span className={styles.showcaseName}>{item.name}</span></div>)}</div>}</div>
            <div className={styles.sideCard}><div className={styles.sideCardHeader}><span className={styles.sideCardTitle}><Users size={14} />Друзья</span></div>{friends.length === 0 ? <p className={styles.sideEmpty}>Пока нет добавленных друзей.</p> : <div className={styles.friendList}>{friends.slice(0, 6).map((friend) => <div key={friend.id} className={styles.friendItem}>{friend.avatar_url ? <img src={getImageUrl(friend.avatar_url) || ''} alt={friend.username} className={styles.friendAvatar} /> : <div className={styles.friendAvatarPlaceholder}>{friend.username.charAt(0).toUpperCase()}</div>}<div className={styles.friendMeta}><strong>{friend.username}</strong><span>{friend.forest_rank || 'Участник'}</span></div></div>)}</div>}</div>
          </aside>
        </section>
      </main>
      {editOpen && <div className={styles.modalOverlay} onClick={() => setEditOpen(false)}><div className={styles.modal} onClick={(event) => event.stopPropagation()}><div className={styles.modalHeader}><span>Редактирование профиля</span><button className={styles.modalClose} onClick={() => setEditOpen(false)}><X size={18} /></button></div><div className={styles.uploadRow}><label htmlFor="profile-avatar-upload" className={`${styles.uploadActionBtn} ${uploading === 'avatar' ? styles.uploadActionBtnDisabled : ''}`} aria-disabled={uploading === 'avatar'}><Camera size={14} />{uploading === 'avatar' ? 'Загрузка аватара...' : 'Изменить аватар'}</label><label htmlFor="profile-banner-upload" className={`${styles.uploadActionBtn} ${uploading === 'banner' ? styles.uploadActionBtnDisabled : ''}`} aria-disabled={uploading === 'banner'}><ImageIcon size={14} />{uploading === 'banner' ? 'Загрузка баннера...' : 'Изменить баннер'}</label><input id="profile-avatar-upload" ref={avatarInputRef} type="file" accept="image/*" hidden disabled={uploading === 'avatar'} onChange={(event) => handleFileSelection('avatar', event)} /><input id="profile-banner-upload" ref={bannerInputRef} type="file" accept="image/*" hidden disabled={uploading === 'banner'} onChange={(event) => handleFileSelection('banner', event)} /></div><label className={styles.fieldLabel}>Никнейм</label><input className={styles.fieldInput} value={editNick} onChange={(event) => setEditNick(event.target.value)} placeholder={profile.discord_username} maxLength={32} /><label className={styles.fieldLabel}>О себе</label><textarea className={styles.fieldTextarea} value={editBio} onChange={(event) => setEditBio(event.target.value)} placeholder="Коротко расскажи о себе, своей команде или любимых играх." maxLength={300} rows={5} /><label className={styles.fieldLabel}>Twitch</label><div className={styles.twitchRow}><input className={styles.fieldInput} value={twitchInput} onChange={(event) => setTwitchInput(event.target.value)} placeholder="twitch_username" /><button className={styles.twitchSaveBtn} onClick={saveTwitch} disabled={twitchSaving}>{profile.twitch_username && !twitchInput.trim() ? 'Отвязать' : 'Сохранить'}</button></div><button className={styles.verificationBtn} onClick={openVerificationModal}><BadgePlus size={15} />Верификация<span className={styles.verificationBtnStatus}>{verificationStatusLabel(verificationRequest?.status || profile.verification_status)}</span></button><label className={styles.checkboxRow}><input type="checkbox" checked={editHidden} onChange={(event) => setEditHidden(event.target.checked)} /><span>Скрыть профиль от других пользователей</span></label><div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setEditOpen(false)}>Отмена</button><button className={styles.saveBtn} onClick={saveProfile} disabled={editSaving}>{editSaving ? 'Сохранение...' : 'Сохранить'}</button></div></div></div>}
      {verificationOpen && <div className={styles.modalOverlay} onClick={() => setVerificationOpen(false)}><div className={styles.modal} onClick={(event) => event.stopPropagation()}><div className={styles.modalHeader}><span>Заявка на верификацию</span><button className={styles.modalClose} onClick={() => setVerificationOpen(false)}><X size={18} /></button></div><p className={styles.modalHint}>Оставь данные, чтобы администрация могла проверить профиль и принять решение о верификации.</p><label className={styles.fieldLabel}>Ссылка на Twitch</label><input className={styles.fieldInput} value={verificationTwitch} onChange={(event) => setVerificationTwitch(event.target.value)} placeholder="https://twitch.tv/your_channel" /><label className={styles.fieldLabel}>Контактный Telegram</label><input className={styles.fieldInput} value={verificationTelegram} onChange={(event) => setVerificationTelegram(event.target.value)} placeholder="@telegram или https://t.me/username" /><label className={styles.fieldLabel}>Почему тебя нужно верифицировать?</label><textarea className={styles.fieldTextarea} value={verificationReason} onChange={(event) => setVerificationReason(event.target.value)} placeholder="Расскажи, кто ты, чем занимаешься и почему именно твоему профилю нужна официальная верификация." rows={6} maxLength={1500} />{verificationRequest?.status === 'rejected' && verificationRequest.admin_note ? <div className={styles.statusNotice}><strong>Прошлая заявка была отклонена</strong><span>{verificationRequest.admin_note}</span></div> : null}<div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setVerificationOpen(false)}>Отмена</button><button className={styles.saveBtn} onClick={submitVerificationRequest} disabled={verificationSaving}>{verificationSaving ? 'Отправка...' : 'Отправить заявку'}</button></div></div></div>}
      {achievementsOpen && <div className={styles.modalOverlay} onClick={() => setAchievementsOpen(false)}><div className={styles.modal} onClick={(event) => event.stopPropagation()}><div className={styles.modalHeader}><span>Выбери до 3 достижений для витрины</span><button className={styles.modalClose} onClick={() => setAchievementsOpen(false)}><X size={18} /></button></div><div className={styles.pickerGrid}>{achievements.map((item) => <button key={item.id} className={`${styles.pickerItem} ${showcaseIds.includes(item.id) ? styles.pickerItemSelected : ''}`} onClick={() => toggleShowcase(item.id)} title={item.name}><span className={styles.pickerIcon}>{item.icon}</span><span className={styles.pickerText}><strong>{item.name}</strong><span>{item.description}</span></span>{showcaseIds.includes(item.id) && <Check size={14} className={styles.pickerCheck} />}</button>)}</div><div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setAchievementsOpen(false)}>Отмена</button><button className={styles.saveBtn} onClick={saveShowcase} disabled={showcaseSaving}>{showcaseSaving ? 'Сохранение...' : 'Сохранить витрину'}</button></div></div></div>}
      <Footer />
    </>
  )
}

