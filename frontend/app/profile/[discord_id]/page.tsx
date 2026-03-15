'use client'

import { useEffect, useRef, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { Activity, Award, BarChart2, Calendar, Camera, Check, ChevronLeft, Copy, Edit2, Image as ImageIcon, Star, Trophy, Twitch, UserPlus, Users, X } from 'lucide-react'
import { Navigation } from '../../../components/layout/Navigation'
import { Footer } from '../../../components/layout/Footer'
import { getImageUrl } from '../../../lib/imageUtils'
import { getAuthIdentityFromToken } from '../../../lib/profileIdentifier'
import styles from './profile.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

interface Role { id: number; name: string; color: string }
interface GameAccount { game: string; account_id: string; account_tag: string | null; region: string | null }
interface PublicProfile {
  user_id: number
  discord_id: number | null
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
  roles: Role[]
}
interface MediaItem { id: number; title: string | null; description: string | null; media_type: string; file_url: string; created_at: string }
interface Achievement { id: number; name: string; description: string; icon: string; category: string; points: number; earned_at?: string | null }
interface ActivityItem { type?: string; channel: string | null; created_at?: string | null; joined_at?: string | null; left_at?: string | null; duration_minutes?: number }
interface ActivitySummary { message_count: number; voice_hours: number; recent_messages: ActivityItem[]; recent_voice: ActivityItem[] }
interface TournamentRegistration { id: number; title: string; game: string | null; status: string | null; start_date: string | null; prize: string | null; nickname: string | null; team_name: string | null; registered_at: string | null }
interface FriendItem { id: number; discord_id: number | null; username: string; avatar_url: string | null; forest_rank: string; since: string }

export default function PublicProfilePage() {
  const { discord_id } = useParams<{ discord_id: string }>()
  const router = useRouter()
  const rawIdentifier = String(discord_id ?? '').trim()
  const profileIdentifier = (() => { try { return decodeURIComponent(rawIdentifier) } catch { return rawIdentifier } })()
  const encodedProfileIdentifier = encodeURIComponent(profileIdentifier)

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
  const [showcase, setShowcase] = useState<Achievement[]>([])
  const [activity, setActivity] = useState<ActivitySummary | null>(null)
  const [registrations, setRegistrations] = useState<TournamentRegistration[]>([])
  const [gameAccounts, setGameAccounts] = useState<GameAccount[]>([])
  const [friends, setFriends] = useState<FriendItem[]>([])
  const [tabLoaded, setTabLoaded] = useState<Record<string, boolean>>({})
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [editNick, setEditNick] = useState('')
  const [editBio, setEditBio] = useState('')
  const [editHidden, setEditHidden] = useState(false)
  const [editSaving, setEditSaving] = useState(false)
  const [twitchInput, setTwitchInput] = useState('')
  const [twitchSaving, setTwitchSaving] = useState(false)
  const [achievPickerOpen, setAchievPickerOpen] = useState(false)
  const [showcaseIds, setShowcaseIds] = useState<number[]>([])
  const [showcaseSaving, setShowcaseSaving] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const bannerInputRef = useRef<HTMLInputElement>(null)

  const resetPageState = () => {
    setProfile(null)
    setMedia([])
    setAchievements([])
    setShowcase([])
    setActivity(null)
    setRegistrations([])
    setGameAccounts([])
    setFriends([])
    setShowcaseIds([])
    setTabLoaded({})
    setStatusMessage(null)
  }

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    setToken(t)
    setLoading(true)
    setError(null)
    resetPageState()
    void loadProfile(t)
  }, [profileIdentifier])

  useEffect(() => {
    if (!statusMessage) return
    const timeoutId = window.setTimeout(() => setStatusMessage(null), 3000)
    return () => window.clearTimeout(timeoutId)
  }, [statusMessage])

  const loadProfile = async (t?: string | null) => {
    try {
      const headers = t ? { Authorization: `Bearer ${t}` } : {}
      const res = await axios.get<PublicProfile>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}`, { headers })
      setProfile(res.data)
    } catch (err: any) {
      const status = err.response?.status
      setError(status === 404 ? 'Профиль не найден' : status === 403 ? 'Профиль скрыт' : 'Ошибка загрузки профиля')
    } finally {
      setLoading(false)
    }
  }

  const loadOnce = async <T,>(key: string, loader: () => Promise<T>, setter: (value: T) => void) => {
    if (tabLoaded[key]) return
    try {
      const data = await loader()
      setter(data)
      setTabLoaded(prev => ({ ...prev, [key]: true }))
    } catch {}
  }

  const loadAchievements = async () => loadOnce('achievements', async () => (await axios.get<Achievement[]>(`${API_URL}/api/achievements/user/${encodedProfileIdentifier}?completed_only=true`)).data, setAchievements)
  const loadMedia = async () => loadOnce('media', async () => (await axios.get<MediaItem[]>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}/media`)).data, setMedia)
  const loadActivity = async () => loadOnce('activity', async () => (await axios.get<ActivitySummary>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}/activity`)).data, setActivity)
  const loadRegistrations = async () => loadOnce('tournaments', async () => (await axios.get<TournamentRegistration[]>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}/registrations`)).data, setRegistrations)

  const loadShowcase = async () => {
    try {
      const res = await axios.get<Achievement[]>(`${API_URL}/api/achievements/showcase/${encodedProfileIdentifier}`)
      setShowcase(res.data)
      setShowcaseIds(res.data.map(item => item.id))
    } catch {
      setShowcase([])
      setShowcaseIds([])
    }
  }

  useEffect(() => {
    if (!profile) return
    void axios.get<GameAccount[]>(`${API_URL}/api/game-stats/public/${encodedProfileIdentifier}/accounts`).then(res => setGameAccounts(res.data)).catch(() => setGameAccounts([]))
    void axios.get<FriendItem[]>(`${API_URL}/api/friends/public/${encodedProfileIdentifier}`).then(res => setFriends(res.data)).catch(() => setFriends([]))
    void loadShowcase()
    if (token) {
      void axios.get(`${API_URL}/api/friends/status/${encodedProfileIdentifier}`, { headers: { Authorization: `Bearer ${token}` } }).then(res => setFriendStatus(res.data.status)).catch(() => setFriendStatus('none'))
    }
  }, [profile, token, encodedProfileIdentifier])

  useEffect(() => {
    if (!profile) return
    if (tab === 'media') void loadMedia()
    if (tab === 'achievements') void loadAchievements()
    if (tab === 'activity') void loadActivity()
    if (tab === 'tournaments') void loadRegistrations()
  }, [tab, profile, encodedProfileIdentifier])

  const toggleShowcase = (id: number) => {
    setShowcaseIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id].slice(0, 3))
  }

  const setSuccess = (text: string) => setStatusMessage({ type: 'success', text })
  const setFailure = (text: string) => setStatusMessage({ type: 'error', text })

  const updateFile = async (kind: 'avatar' | 'banner', file: File) => {
    if (!token) return
    const formData = new FormData()
    formData.append('file', file)
    try {
      const res = await axios.post<{ avatar_url?: string; banner_url?: string }>(`${API_URL}/api/profile/${kind}`, formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
      })
      setProfile(prev => prev ? { ...prev, ...(kind === 'avatar' ? { avatar_url: res.data.avatar_url ?? prev.avatar_url } : { banner_url: res.data.banner_url ?? prev.banner_url }) } : prev)
      setSuccess(kind === 'avatar' ? 'Аватар обновлён.' : 'Баннер обновлён.')
    } catch {
      setFailure(kind === 'avatar' ? 'Не удалось загрузить аватар.' : 'Не удалось загрузить баннер.')
    } finally {
      if (kind === 'avatar' && avatarInputRef.current) avatarInputRef.current.value = ''
      if (kind === 'banner' && bannerInputRef.current) bannerInputRef.current.value = ''
    }
  }

  const authIdentity = getAuthIdentityFromToken(token)
  const isOwnProfile = Boolean((authIdentity.userId && profile?.user_id && authIdentity.userId === String(profile.user_id)) || (authIdentity.discordId && profile?.discord_id && authIdentity.discordId === String(profile.discord_id)))
  const displayName = profile?.site_nickname || profile?.discord_username || 'Профиль'
  const publicIdentifier = profile?.user_tag || profile?.discord_id || profile?.user_id || profileIdentifier
  const sharePath = `/profile/${encodeURIComponent(String(publicIdentifier))}`

  const copyLink = async () => {
    const shareUrl = typeof window === 'undefined' ? sharePath : `${window.location.origin}${sharePath}`
    try {
      if (navigator.share) {
        await navigator.share({ title: `${displayName} | Lesnaya Komanda`, text: `Профиль игрока ${displayName}`, url: shareUrl })
        return
      }
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      setFailure('Не удалось поделиться ссылкой на профиль.')
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
      const res = await axios.put<PublicProfile>(`${API_URL}/api/profile`, { site_nickname: editNick || null, bio: editBio || null, is_hidden: editHidden }, { headers: { Authorization: `Bearer ${token}` } })
      setProfile(prev => prev ? { ...prev, ...res.data } : prev)
      setEditOpen(false)
      setSuccess('Профиль сохранён.')
    } catch {
      setFailure('Не удалось сохранить профиль.')
    } finally {
      setEditSaving(false)
    }
  }

  const saveTwitch = async () => {
    if (!token) return
    setTwitchSaving(true)
    try {
      if (twitchInput.trim()) {
        await axios.post(`${API_URL}/api/profile/twitch?twitch_username=${encodeURIComponent(twitchInput.trim())}`, {}, { headers: { Authorization: `Bearer ${token}` } })
        setProfile(prev => prev ? { ...prev, twitch_username: twitchInput.trim() } : prev)
      } else {
        await axios.delete(`${API_URL}/api/profile/twitch`, { headers: { Authorization: `Bearer ${token}` } })
        setProfile(prev => prev ? { ...prev, twitch_username: null } : prev)
      }
      setSuccess('Twitch обновлён.')
    } catch {
      setFailure('Не удалось обновить Twitch.')
    } finally {
      setTwitchSaving(false)
    }
  }

  const saveShowcase = async () => {
    if (!token) return
    setShowcaseSaving(true)
    try {
      await axios.put(`${API_URL}/api/achievements/showcase`, { achievement_ids: showcaseIds }, { headers: { Authorization: `Bearer ${token}` } })
      setShowcase(achievements.filter(item => showcaseIds.includes(item.id)))
      setAchievPickerOpen(false)
      setSuccess('Витрина достижений обновлена.')
    } catch {
      setFailure('Не удалось обновить витрину достижений.')
    } finally {
      setShowcaseSaving(false)
    }
  }

  const sendFriendRequest = async () => {
    if (!token) return
    setFriendLoading(true)
    try {
      const res = await axios.post<{ status: 'sent' | 'accepted' }>(`${API_URL}/api/friends/request/${encodedProfileIdentifier}`, {}, { headers: { Authorization: `Bearer ${token}` } })
      setFriendStatus(res.data.status === 'accepted' ? 'friends' : 'pending')
      setSuccess('Заявка в друзья отправлена.')
    } catch {
      setFailure('Не удалось отправить заявку в друзья.')
    } finally {
      setFriendLoading(false)
    }
  }

  if (loading) return <><Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} /><div className={styles.loadingPage}><div className={styles.spinner} /></div></>
  if (error || !profile) return <><Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} /><div className={styles.errorPage}><h2>{error || 'Профиль не найден'}</h2><button onClick={() => router.push('/')} className={styles.backBtn}><ChevronLeft size={16} /> На главную</button></div></>

  const xpPercent = Math.min(100, (profile.current_xp / Math.max(1, profile.level * 100)) * 100)
  const joinDate = profile.joined_at ? new Date(profile.joined_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' }) : null
  const showcaseItems = showcase.length > 0 ? showcase : achievements.slice(0, 3)

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.page}>
        {statusMessage && <div className={`${styles.statusMessage} ${statusMessage.type === 'success' ? styles.statusSuccess : styles.statusError}`}>{statusMessage.text}</div>}
        <div className={styles.profileCard}>
          <div className={styles.banner} style={profile.banner_url ? { backgroundImage: `url(${getImageUrl(profile.banner_url)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}>
            {isOwnProfile && <><button className={styles.bannerEditBtn} onClick={() => bannerInputRef.current?.click()}><Camera size={14} /> Сменить баннер</button><input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) void updateFile('banner', e.target.files[0]) }} /></>}
          </div>
          <div className={styles.avatarRow}>
            <div className={styles.avatarWrap}>
              {profile.avatar_url ? <img src={getImageUrl(profile.avatar_url) || ''} alt={displayName} className={styles.avatar} /> : <div className={styles.avatarPlaceholder}>{displayName[0]?.toUpperCase()}</div>}
              {isOwnProfile && <><button className={styles.avatarEditBtn} onClick={() => avatarInputRef.current?.click()}><Camera size={14} /></button><input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) void updateFile('avatar', e.target.files[0]) }} /></>}
            </div>
            <div className={styles.avatarActions}>
              {isOwnProfile ? <button className={styles.editBtn} onClick={openEdit}><Edit2 size={14} /> Редактировать</button> : token && <button className={`${styles.friendBtn} ${(friendStatus === 'pending' || friendStatus === 'friends') ? styles.friendBtnDisabled : ''}`} onClick={sendFriendRequest} disabled={friendLoading || friendStatus === 'pending' || friendStatus === 'friends'}><UserPlus size={14} />{friendStatus === 'friends' ? 'Вы друзья' : friendStatus === 'pending' ? 'Заявка отправлена' : friendStatus === 'incoming' ? 'Принять заявку' : 'Добавить'}</button>}
              <button className={styles.shareBtn} onClick={copyLink}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? 'Скопировано' : 'Поделиться'}</button>
            </div>
          </div>
          <div className={styles.profileInfo}>
            <div className={styles.nameRow}><h1 className={styles.name}>{displayName}</h1><span className={styles.levelBadge}><Star size={11} /> {profile.level}</span></div>
            <div className={styles.handleRow}>@{profile.discord_username}{profile.forest_rank && <span className={styles.rank}> · {profile.forest_rank}</span>}{publicIdentifier && <span className={styles.rank}> · ID: {String(publicIdentifier)}</span>}{profile.twitch_username && <a href={`https://twitch.tv/${profile.twitch_username}`} target="_blank" rel="noreferrer" className={styles.twitchLink}><Twitch size={12} /> {profile.twitch_username}</a>}</div>
            <div className={styles.statsInline}><span className={styles.statItem}><Trophy size={12} /> Турниров: {profile.tourney_stats?.played ?? 0}</span><span className={styles.statItem}><Star size={12} /> Побед: {profile.tourney_stats?.wins ?? 0}</span><span className={styles.statItem}>Рейтинг: {profile.rating}</span>{joinDate && <span className={styles.statItem}><Calendar size={12} /> С {joinDate}</span>}</div>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
            {profile.roles.length > 0 && <div className={styles.rolesRow}>{profile.roles.map(role => <span key={role.id} className={styles.roleBadge} style={{ borderColor: role.color, color: role.color }}>{role.name}</span>)}</div>}
          </div>
        </div>

        <div className={styles.columns}>
          <div className={styles.mainCol}>
            <div className={styles.tabs}>
              <button className={`${styles.tab} ${tab === 'media' ? styles.tabActive : ''}`} onClick={() => setTab('media')}><ImageIcon size={14} /> Медиа</button>
              <button className={`${styles.tab} ${tab === 'stats' ? styles.tabActive : ''}`} onClick={() => setTab('stats')}><BarChart2 size={14} /> Статистика</button>
              <button className={`${styles.tab} ${tab === 'tournaments' ? styles.tabActive : ''}`} onClick={() => setTab('tournaments')}><Trophy size={14} /> Турниры</button>
              <button className={`${styles.tab} ${tab === 'activity' ? styles.tabActive : ''}`} onClick={() => setTab('activity')}><Activity size={14} /> Активность</button>
              <button className={`${styles.tab} ${tab === 'achievements' ? styles.tabActive : ''}`} onClick={() => setTab('achievements')}><Award size={14} /> Достижения</button>
            </div>
            <div className={styles.tabContent}>
              {tab === 'media' && <div className={styles.mediaGrid}>{media.length === 0 ? <p className={styles.emptyText}>Нет загруженных медиа</p> : media.map(item => <div key={item.id} className={styles.mediaCard}>{item.media_type === 'image' ? <img src={getImageUrl(item.file_url) || ''} alt={item.title ?? ''} className={styles.mediaThumb} /> : <video src={getImageUrl(item.file_url) || ''} className={styles.mediaThumb} muted />}{item.title && <p className={styles.mediaTitle}>{item.title}</p>}</div>)}</div>}
              {tab === 'stats' && <div className={styles.statsPanel}><h3 className={styles.statsSectionTitle}>Статистика сайта</h3><div className={styles.statRow}><span>Уровень</span><strong>{profile.level}</strong></div><div className={styles.statRow}><span>Рейтинг</span><strong>{profile.rating}</strong></div><div className={styles.statRow}><span>Турниров сыграно</span><strong>{profile.tourney_stats?.played ?? 0}</strong></div><div className={styles.statRow}><span>Турниров выиграно</span><strong>{profile.tourney_stats?.wins ?? 0}</strong></div><div className={styles.statRow}><span>Опыт</span><strong>{profile.current_xp} / {profile.level * 100} XP</strong></div><div className={styles.xpBarInline}><div className={styles.xpFill} style={{ width: `${xpPercent}%` }} /></div>{gameAccounts.length > 0 ? <><h3 className={styles.statsSectionTitle} style={{ marginTop: '16px' }}>Привязанные игры</h3>{gameAccounts.map(account => <div key={account.game} className={styles.gameAccountRow}><span className={styles.gameLabel}>{account.game === 'steam' ? 'Steam' : account.game === 'dota2' ? 'Dota 2' : account.game === 'valorant' ? 'Valorant' : account.game}</span><span className={styles.gameId}>{account.account_tag ? `${account.account_id}#${account.account_tag}` : account.account_id}</span></div>)}</> : <p className={styles.emptyText} style={{ marginTop: '12px' }}>Нет привязанных игровых аккаунтов</p>}</div>}
              {tab === 'tournaments' && <div className={styles.sectionList}>{registrations.length === 0 ? <p className={styles.emptyText}>Нет открытых записей на турниры.</p> : registrations.map(item => <div key={`${item.id}-${item.registered_at ?? 'registration'}`} className={styles.listCard}><div className={styles.listCardTitle}>{item.title}</div><div className={styles.listCardMeta}>{item.game && <span>{item.game}</span>}{item.status && <span>Статус: {item.status}</span>}{item.team_name && <span>Команда: {item.team_name}</span>}{item.nickname && <span>Ник: {item.nickname}</span>}{item.start_date && <span>Старт: {new Date(item.start_date).toLocaleDateString('ru-RU')}</span>}{item.prize && <span>Приз: {item.prize}</span>}</div></div>)}</div>}
              {tab === 'activity' && <div className={styles.sectionList}><div className={styles.listCard}><div className={styles.listCardTitle}>Активность на сервере</div><div className={styles.listCardMeta}><span>Сообщений: {activity?.message_count ?? 0}</span><span>Голосовых часов: {activity?.voice_hours ?? 0}</span></div></div><div className={styles.subsection}><h3 className={styles.statsSectionTitle}>Последние сообщения</h3>{activity?.recent_messages?.length ? activity.recent_messages.map((item, index) => <div key={`${item.created_at ?? index}-${item.channel ?? 'message'}`} className={styles.listCard}><div className={styles.listCardTitle}>{item.channel || 'Без канала'}</div><div className={styles.listCardMeta}>{item.type && <span>Тип: {item.type}</span>}{item.created_at && <span>{new Date(item.created_at).toLocaleString('ru-RU')}</span>}</div></div>) : <p className={styles.emptyText}>Нет данных по сообщениям.</p>}</div><div className={styles.subsection}><h3 className={styles.statsSectionTitle}>Последние голосовые сессии</h3>{activity?.recent_voice?.length ? activity.recent_voice.map((item, index) => <div key={`${item.joined_at ?? index}-${item.channel ?? 'voice'}`} className={styles.listCard}><div className={styles.listCardTitle}>{item.channel || 'Без канала'}</div><div className={styles.listCardMeta}>{item.joined_at && <span>Начало: {new Date(item.joined_at).toLocaleString('ru-RU')}</span>}{item.left_at && <span>Конец: {new Date(item.left_at).toLocaleString('ru-RU')}</span>}{typeof item.duration_minutes === 'number' && <span>Длительность: {item.duration_minutes} мин.</span>}</div></div>) : <p className={styles.emptyText}>Нет данных по голосовой активности.</p>}</div></div>}
              {tab === 'achievements' && <div className={styles.achievGrid}>{achievements.length === 0 ? <p className={styles.emptyText}>Нет достижений</p> : achievements.map(item => <div key={item.id} className={styles.achievCard}><div className={styles.achievIcon}>{item.icon}</div><div className={styles.achievInfo}><div className={styles.achievName}>{item.name}</div><div className={styles.achievDesc}>{item.description}</div></div><div className={styles.achievPoints}>+{item.points}</div></div>)}</div>}
            </div>
          </div>

          <div className={styles.sidebar}>
            <div className={styles.sideCard}><div className={styles.sideCardHeader}><Users size={14} /> Друзья</div>{friends.length === 0 ? <p className={styles.sideCardEmpty}>Пока нет добавленных друзей.</p> : friends.slice(0, 6).map(friend => <div key={friend.id} className={styles.linkedAccount}><span>{friend.username}</span><span className={styles.gameId}>{friend.forest_rank}</span></div>)}</div>
            <div className={styles.sideCard}><div className={styles.sideCardHeader}><span className={styles.sideCardHeaderLeft}><Award size={14} /> Достижения</span>{isOwnProfile && achievements.length > 0 && <button className={styles.sideCardEditBtn} onClick={() => { void loadAchievements(); setAchievPickerOpen(true) }} title="Выбрать отображаемые"><Edit2 size={13} /></button>}</div>{showcaseItems.length === 0 ? <p className={styles.sideCardEmpty}>Нет достижений</p> : <div className={styles.achievShowcase}>{showcaseItems.map(item => <div key={item.id} className={styles.achievBadge} title={item.name}>{item.icon}</div>)}</div>}</div>
            <div className={styles.sideCard}><div className={styles.sideCardHeader}>Публичная ссылка</div><div className={styles.linkedAccount}>{sharePath}</div></div>
            <div className={styles.sideCard}><div className={styles.sideCardHeader}>Привязанные аккаунты</div>{profile.twitch_username && <a href={`https://twitch.tv/${profile.twitch_username}`} target="_blank" rel="noreferrer" className={styles.linkedAccount}><Twitch size={14} /> {profile.twitch_username}</a>}{gameAccounts.map(account => <div key={account.game} className={styles.linkedAccount}><span className={styles.gameChip}>{account.game === 'steam' ? '🎮' : account.game === 'dota2' ? '⚔️' : account.game === 'valorant' ? '🔫' : '🕹️'}</span><span>{account.account_tag ? `${account.account_id}#${account.account_tag}` : account.account_id}</span></div>)}{!profile.twitch_username && gameAccounts.length === 0 && <p className={styles.sideCardEmpty}>{isOwnProfile ? 'Привяжи аккаунты в редактировании' : 'Нет привязанных аккаунтов'}</p>}</div>
          </div>
        </div>
      </div>

      {editOpen && <div className={styles.modalOverlay} onClick={() => setEditOpen(false)}><div className={styles.modal} onClick={event => event.stopPropagation()}><div className={styles.modalHeader}><span>Редактировать профиль</span><button className={styles.modalClose} onClick={() => setEditOpen(false)}><X size={18} /></button></div><label className={styles.fieldLabel}>Никнейм</label><input className={styles.fieldInput} value={editNick} onChange={event => setEditNick(event.target.value)} placeholder={profile.discord_username} maxLength={32} /><label className={styles.fieldLabel}>О себе</label><textarea className={styles.fieldTextarea} value={editBio} onChange={event => setEditBio(event.target.value)} placeholder="Расскажи о себе..." maxLength={300} rows={4} /><label className={styles.fieldLabel}>Twitch</label><div className={styles.twitchRow}><input className={styles.fieldInput} value={twitchInput} onChange={event => setTwitchInput(event.target.value)} placeholder="twitch_username" /><button className={styles.twitchSaveBtn} onClick={saveTwitch} disabled={twitchSaving}>{profile.twitch_username && !twitchInput.trim() ? 'Отвязать' : 'Сохранить'}</button></div><label className={styles.hiddenRow}><input type="checkbox" checked={editHidden} onChange={event => setEditHidden(event.target.checked)} />Скрыть профиль</label><div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setEditOpen(false)}>Отмена</button><button className={styles.saveBtn} onClick={saveProfile} disabled={editSaving}>Сохранить</button></div></div></div>}
      {achievPickerOpen && <div className={styles.modalOverlay} onClick={() => setAchievPickerOpen(false)}><div className={styles.modal} onClick={event => event.stopPropagation()}><div className={styles.modalHeader}><span>Выбери достижения для показа (до 3)</span><button className={styles.modalClose} onClick={() => setAchievPickerOpen(false)}><X size={18} /></button></div><div className={styles.achievPickerGrid}>{achievements.map(item => <button key={item.id} className={`${styles.achievPickerItem} ${showcaseIds.includes(item.id) ? styles.achievPickerSelected : ''}`} onClick={() => toggleShowcase(item.id)} title={item.name}><span className={styles.achievIcon}>{item.icon}</span><span className={styles.achievPickerName}>{item.name}</span>{showcaseIds.includes(item.id) && <Check size={12} className={styles.achievPickerCheck} />}</button>)}</div><div className={styles.modalFooter}><button className={styles.cancelBtn} onClick={() => setAchievPickerOpen(false)}>Отмена</button><button className={styles.saveBtn} onClick={saveShowcase} disabled={showcaseSaving}>{showcaseSaving ? 'Сохранение...' : 'Сохранить витрину'}</button></div></div></div>}
      <Footer />
    </>
  )
}
