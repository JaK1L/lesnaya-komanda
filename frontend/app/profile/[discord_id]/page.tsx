'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { UserPlus, Trophy, Star, Calendar, Copy, Check, ChevronLeft, Edit2, X, Camera, Twitch, Image as ImageIcon, Award, Activity, BarChart2, Users } from 'lucide-react'
import { Navigation } from '../../../components/layout/Navigation'
import { Footer } from '../../../components/layout/Footer'
import { getImageUrl } from '../../../lib/imageUtils'
import { getAuthIdentityFromToken } from '../../../lib/profileIdentifier'
import styles from './profile.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

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
  name: string
  description: string
  icon: string
  category: string
  points: number
  completed_at: string
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
  const [tabLoaded, setTabLoaded] = useState<Record<string, boolean>>({})

  const [gameAccounts, setGameAccounts] = useState<GameAccount[]>([])
  const [pinnedIds, setPinnedIds] = useState<number[]>([])
  const [achievPickerOpen, setAchievPickerOpen] = useState(false)

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

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    setToken(t)
    loadProfile(t)
    loadGameAccounts()
    if (t) loadFriendStatus(t)
    // Load pinned from localStorage
    try {
      const saved = localStorage.getItem(`pinned_ach_${profileIdentifier}`)
      if (saved) setPinnedIds(JSON.parse(saved))
    } catch {}
  }, [profileIdentifier])

  const loadProfile = async (t?: string | null) => {
    try {
      const headers = t ? { Authorization: `Bearer ${t}` } : {}
      const res = await axios.get<PublicProfile>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}`, { headers })
      setProfile(res.data)
    } catch (err: any) {
      const s = err.response?.status
      setError(s === 404 ? 'Профиль не найден' : s === 403 ? 'Профиль скрыт' : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const loadFriendStatus = async (t: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/friends/status/${encodedProfileIdentifier}`, { headers: { Authorization: `Bearer ${t}` } })
      setFriendStatus(res.data.status)
    } catch { }
  }

  const loadMedia = async () => {
    if (tabLoaded.media) return
    try {
      const res = await axios.get<MediaItem[]>(`${API_URL}/api/profile/public/${encodedProfileIdentifier}/media`)
      setMedia(res.data)
      setTabLoaded(p => ({ ...p, media: true }))
    } catch { }
  }

  const loadAchievements = async () => {
    if (tabLoaded.achievements) return
    try {
      const res = await axios.get<Achievement[]>(`${API_URL}/api/achievements/user/${encodedProfileIdentifier}?completed_only=true`)
      setAchievements(res.data)
      setTabLoaded(p => ({ ...p, achievements: true }))
    } catch { }
  }

  const loadGameAccounts = async () => {
    try {
      const res = await axios.get<GameAccount[]>(`${API_URL}/api/game-stats/public/${encodedProfileIdentifier}/accounts`)
      setGameAccounts(res.data)
    } catch { }
  }

  useEffect(() => {
    if (tab === 'media') loadMedia()
    else loadAchievements()
  }, [tab, encodedProfileIdentifier])

  const togglePin = (id: number) => {
    const next = pinnedIds.includes(id) ? pinnedIds.filter(x => x !== id) : [...pinnedIds, id].slice(0, 6)
    setPinnedIds(next)
    localStorage.setItem(`pinned_ach_${profileIdentifier}`, JSON.stringify(next))
  }

  const sendFriendRequest = async () => {
    if (!token) return
    setFriendLoading(true)
    try {
      const res = await axios.post<{ status: 'sent' | 'accepted' }>(
        `${API_URL}/api/friends/request/${encodedProfileIdentifier}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      setFriendStatus(res.data.status === 'accepted' ? 'friends' : 'pending')
    } catch { } finally { setFriendLoading(false) }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
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
      const res = await axios.put<PublicProfile>(`${API_URL}/api/profile`, {
        site_nickname: editNick || null,
        bio: editBio || null,
        is_hidden: editHidden,
      }, { headers: { Authorization: `Bearer ${token}` } })
      setProfile(p => p ? { ...p, ...res.data } : p)
      setEditOpen(false)
    } catch { } finally { setEditSaving(false) }
  }

  const uploadBanner = async (file: File) => {
    if (!token) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axios.post<{ banner_url: string }>(`${API_URL}/api/profile/banner`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      setProfile(p => p ? { ...p, banner_url: res.data.banner_url } : p)
    } catch { }
  }

  const uploadAvatar = async (file: File) => {
    if (!token) return
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await axios.post<{ avatar_url: string }>(`${API_URL}/api/profile/avatar`, fd, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      setProfile(p => p ? { ...p, avatar_url: res.data.avatar_url } : p)
    } catch { }
  }

  const saveTwitch = async () => {
    if (!token) return
    setTwitchSaving(true)
    try {
      if (twitchInput.trim()) {
        await axios.post(`${API_URL}/api/profile/twitch?twitch_username=${encodeURIComponent(twitchInput.trim())}`, {}, { headers: { Authorization: `Bearer ${token}` } })
        setProfile(p => p ? { ...p, twitch_username: twitchInput.trim() } : p)
      } else {
        await axios.delete(`${API_URL}/api/profile/twitch`, { headers: { Authorization: `Bearer ${token}` } })
        setProfile(p => p ? { ...p, twitch_username: null } : p)
      }
    } catch { } finally { setTwitchSaving(false) }
  }

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
        <h2>{error || 'Профиль не найден'}</h2>
        <button onClick={() => router.push('/')} className={styles.backBtn}><ChevronLeft size={16} /> На главную</button>
      </div>
    </>
  )

  const displayName = profile.site_nickname || profile.discord_username
  const xpPercent = Math.min(100, (profile.current_xp / Math.max(1, profile.level * 100)) * 100)
  const joinDate = profile.joined_at
    ? new Date(profile.joined_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long' })
    : null

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.page}>

        {/* Profile Header Card */}
        <div className={styles.profileCard}>
          {/* Banner */}
          <div
            className={styles.banner}
            style={profile.banner_url ? { backgroundImage: `url(${getImageUrl(profile.banner_url)})`, backgroundSize: 'cover', backgroundPosition: 'center' } : undefined}
          >
            {isOwnProfile && (
              <>
                <button className={styles.bannerEditBtn} onClick={() => bannerInputRef.current?.click()}><Camera size={14} /> Сменить баннер</button>
                <input ref={bannerInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadBanner(e.target.files[0]) }} />
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
                  <button className={styles.avatarEditBtn} onClick={() => avatarInputRef.current?.click()}><Camera size={14} /></button>
                  <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]) }} />
                </>
              )}
            </div>

            <div className={styles.avatarActions}>
              {isOwnProfile ? (
                <button className={styles.editBtn} onClick={openEdit}><Edit2 size={14} /> Редактировать</button>
              ) : token && (
                <button
                  className={`${styles.friendBtn} ${(friendStatus === 'pending' || friendStatus === 'friends') ? styles.friendBtnDisabled : ''}`}
                  onClick={sendFriendRequest}
                  disabled={friendLoading || friendStatus === 'pending' || friendStatus === 'friends'}
                >
                  <UserPlus size={14} />
                  {friendStatus === 'friends'
                    ? 'Вы друзья'
                    : friendStatus === 'pending'
                      ? 'Заявка отправлена'
                      : friendStatus === 'incoming'
                        ? 'Принять заявку'
                        : 'Добавить'}
                </button>
              )}
              <button className={styles.shareBtn} onClick={copyLink}>
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Скопировано' : 'Поделиться'}
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
              {profile.forest_rank && <span className={styles.rank}> · {profile.forest_rank}</span>}
              {profile.twitch_username && (
                <a href={`https://twitch.tv/${profile.twitch_username}`} target="_blank" rel="noreferrer" className={styles.twitchLink}>
                  <Twitch size={12} /> {profile.twitch_username}
                </a>
              )}
            </div>
            <div className={styles.statsInline}>
              <span className={styles.statItem}><Trophy size={12} /> Турниров: {profile.tourney_stats?.played ?? 0}</span>
              <span className={styles.statItem}><Star size={12} /> Побед: {profile.tourney_stats?.wins ?? 0}</span>
              <span className={styles.statItem}>Рейтинг: {profile.rating}</span>
              {joinDate && <span className={styles.statItem}><Calendar size={12} /> с {joinDate}</span>}
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
              <button className={`${styles.tab} ${tab === 'media' ? styles.tabActive : ''}`} onClick={() => setTab('media')}><ImageIcon size={14} /> Медиа</button>
              <button className={`${styles.tab} ${tab === 'stats' ? styles.tabActive : ''}`} onClick={() => setTab('stats')}><BarChart2 size={14} /> Статистика</button>
              <button className={`${styles.tab} ${tab === 'tournaments' ? styles.tabActive : ''}`} onClick={() => setTab('tournaments')}><Trophy size={14} /> Турниры</button>
              <button className={`${styles.tab} ${tab === 'activity' ? styles.tabActive : ''}`} onClick={() => setTab('activity')}><Activity size={14} /> Активность</button>
              <button className={`${styles.tab} ${tab === 'achievements' ? styles.tabActive : ''}`} onClick={() => setTab('achievements')}><Award size={14} /> Достижения</button>
            </div>

            <div className={styles.tabContent}>
              {tab === 'media' && (
                <div className={styles.mediaGrid}>
                  {media.length === 0
                    ? <p className={styles.emptyText}>Нет загруженных медиа</p>
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
                  <h3 className={styles.statsSectionTitle}>Статистика сайта</h3>
                  <div className={styles.statRow}><span>Уровень</span><strong>{profile.level}</strong></div>
                  <div className={styles.statRow}><span>Рейтинг</span><strong>{profile.rating}</strong></div>
                  <div className={styles.statRow}><span>Турниров сыграно</span><strong>{profile.tourney_stats?.played ?? 0}</strong></div>
                  <div className={styles.statRow}><span>Турниров выиграно</span><strong>{profile.tourney_stats?.wins ?? 0}</strong></div>
                  <div className={styles.statRow}><span>Опыт</span><strong>{profile.current_xp} / {profile.level * 100} XP</strong></div>
                  <div className={styles.xpBarInline}><div className={styles.xpFill} style={{ width: `${xpPercent}%` }} /></div>

                  {gameAccounts.length > 0 && (
                    <>
                      <h3 className={styles.statsSectionTitle} style={{ marginTop: '16px' }}>Привязанные игры</h3>
                      {gameAccounts.map(g => (
                        <div key={g.game} className={styles.gameAccountRow}>
                          <span className={styles.gameLabel}>{g.game === 'steam' ? 'Steam' : g.game === 'dota2' ? 'Dota 2' : g.game === 'valorant' ? 'Valorant' : g.game}</span>
                          <span className={styles.gameId}>{g.account_tag ? `${g.account_id}#${g.account_tag}` : g.account_id}</span>
                        </div>
                      ))}
                    </>
                  )}
                  {gameAccounts.length === 0 && (
                    <p className={styles.emptyText} style={{ marginTop: '12px' }}>Нет привязанных игровых аккаунтов</p>
                  )}
                </div>
              )}

              {tab === 'tournaments' && (
                <p className={styles.emptyText}>Турниры скоро появятся</p>
              )}

              {tab === 'activity' && (
                <p className={styles.emptyText}>Активность скоро появится</p>
              )}

              {tab === 'achievements' && (
                <div className={styles.achievGrid}>
                  {achievements.length === 0
                    ? <p className={styles.emptyText}>Нет достижений</p>
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
              <div className={styles.sideCardHeader}><Users size={14} /> Друзья</div>
              <p className={styles.sideCardEmpty}>Список друзей скоро</p>
            </div>

            {/* Achievements showcase */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>
                <span className={styles.sideCardHeaderLeft}><Award size={14} /> Достижения</span>
                {isOwnProfile && achievements.length > 0 && (
                  <button className={styles.sideCardEditBtn} onClick={() => { loadAchievements(); setAchievPickerOpen(true) }} title="Выбрать отображаемые"><Edit2 size={13} /></button>
                )}
              </div>
              {achievements.length === 0
                ? <p className={styles.sideCardEmpty}>Нет достижений</p>
                : <div className={styles.achievShowcase}>
                    {(pinnedIds.length > 0
                      ? achievements.filter(a => pinnedIds.includes(a.id))
                      : achievements.slice(0, 6)
                    ).map(a => (
                      <div key={a.id} className={styles.achievBadge} title={a.name}>{a.icon}</div>
                    ))}
                  </div>
              }
            </div>

            {/* Linked accounts */}
            <div className={styles.sideCard}>
              <div className={styles.sideCardHeader}>Привязанные аккаунты</div>
              {profile.twitch_username && (
                <a href={`https://twitch.tv/${profile.twitch_username}`} target="_blank" rel="noreferrer" className={styles.linkedAccount}>
                  <Twitch size={14} /> {profile.twitch_username}
                </a>
              )}
              {gameAccounts.map(g => (
                <div key={g.game} className={styles.linkedAccount}>
                  <span className={styles.gameChip}>{g.game === 'steam' ? '🎮' : g.game === 'dota2' ? '⚔️' : g.game === 'valorant' ? '🔫' : '🕹️'}</span>
                  <span>{g.account_tag ? `${g.account_id}#${g.account_tag}` : g.account_id}</span>
                </div>
              ))}
              {!profile.twitch_username && gameAccounts.length === 0 && (
                <p className={styles.sideCardEmpty}>{isOwnProfile ? 'Привяжи аккаунты в редактировании' : 'Нет привязанных аккаунтов'}</p>
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
              <span>Редактировать профиль</span>
              <button className={styles.modalClose} onClick={() => setEditOpen(false)}><X size={18} /></button>
            </div>

            <label className={styles.fieldLabel}>Никнейм</label>
            <input className={styles.fieldInput} value={editNick} onChange={e => setEditNick(e.target.value)} placeholder={profile.discord_username} maxLength={32} />

            <label className={styles.fieldLabel}>О себе</label>
            <textarea className={styles.fieldTextarea} value={editBio} onChange={e => setEditBio(e.target.value)} placeholder="Расскажи о себе..." maxLength={300} rows={4} />

            <label className={styles.fieldLabel}>Twitch</label>
            <div className={styles.twitchRow}>
              <input className={styles.fieldInput} value={twitchInput} onChange={e => setTwitchInput(e.target.value)} placeholder="twitch_username" />
              <button className={styles.twitchSaveBtn} onClick={saveTwitch} disabled={twitchSaving}>
                {profile.twitch_username && !twitchInput.trim() ? 'Отвязать' : 'Сохранить'}
              </button>
            </div>

            <label className={styles.hiddenRow}>
              <input type="checkbox" checked={editHidden} onChange={e => setEditHidden(e.target.checked)} />
              Скрыть профиль
            </label>

            <div className={styles.modalFooter}>
              <button className={styles.cancelBtn} onClick={() => setEditOpen(false)}>Отмена</button>
              <button className={styles.saveBtn} onClick={saveProfile} disabled={editSaving}>Сохранить</button>
            </div>
          </div>
        </div>
      )}

      {/* Achievement Picker Modal */}
      {achievPickerOpen && (
        <div className={styles.modalOverlay} onClick={() => setAchievPickerOpen(false)}>
          <div className={styles.modal} onClick={e => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <span>Выбери достижения для показа (до 6)</span>
              <button className={styles.modalClose} onClick={() => setAchievPickerOpen(false)}><X size={18} /></button>
            </div>
            <div className={styles.achievPickerGrid}>
              {achievements.map(a => (
                <button
                  key={a.id}
                  className={`${styles.achievPickerItem} ${pinnedIds.includes(a.id) ? styles.achievPickerSelected : ''}`}
                  onClick={() => togglePin(a.id)}
                  title={a.name}
                >
                  <span className={styles.achievIcon}>{a.icon}</span>
                  <span className={styles.achievPickerName}>{a.name}</span>
                  {pinnedIds.includes(a.id) && <Check size={12} className={styles.achievPickerCheck} />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  )
}

