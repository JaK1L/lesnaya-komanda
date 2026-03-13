'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import axios from 'axios'
import { UserPlus, Trophy, Star, Calendar, Copy, Check, ChevronLeft } from 'lucide-react'
import { Navigation } from '../../../components/layout/Navigation'
import { Footer } from '../../../components/layout/Footer'
import { getImageUrl } from '../../../lib/imageUtils'
import styles from './profile.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

interface PublicProfile {
  discord_id: number
  site_nickname: string | null
  discord_username: string
  avatar_url: string | null
  bio: string | null
  forest_rank: string
  rating: number
  level: number
  current_xp: number
  total_xp: number
  joined_at: string | null
  tourney_stats: { played: number; wins: number }
}

function getMyDiscordId(token: string | null): string | null {
  if (!token) return null
  try { return String(JSON.parse(atob(token.split('.')[1])).discord_id ?? '') } catch { return null }
}

export default function PublicProfilePage() {
  const { discord_id } = useParams<{ discord_id: string }>()
  const router = useRouter()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [friendStatus, setFriendStatus] = useState<'none' | 'pending' | 'friends'>('none')
  const [friendLoading, setFriendLoading] = useState(false)

  useEffect(() => {
    const t = localStorage.getItem(TOKEN_KEY)
    setToken(t)
    loadProfile()
    if (t) loadFriendStatus(t)
  }, [discord_id])

  const loadProfile = async () => {
    try {
      const res = await axios.get<PublicProfile>(`${API_URL}/api/profile/public/${discord_id}`)
      setProfile(res.data)
    } catch (err: any) {
      setError(err.response?.status === 404 ? 'Профиль не найден' : err.response?.status === 403 ? 'Профиль скрыт' : 'Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const loadFriendStatus = async (t: string) => {
    try {
      const res = await axios.get(`${API_URL}/api/friends/status/${discord_id}`, {
        headers: { Authorization: `Bearer ${t}` }
      })
      setFriendStatus(res.data.status)
    } catch { /* ignore */ }
  }

  const sendFriendRequest = async () => {
    if (!token) return
    setFriendLoading(true)
    try {
      await axios.post(`${API_URL}/api/friends/request/${discord_id}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setFriendStatus('pending')
    } catch { /* ignore */ } finally {
      setFriendLoading(false)
    }
  }

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const myDiscordId = getMyDiscordId(token)
  const isOwnProfile = myDiscordId === String(discord_id)

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

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.page}>

        {/* Header card */}
        <div className={styles.headerCard}>
          <div className={styles.avatarWrap}>
            {profile.avatar_url ? (
              <img src={getImageUrl(profile.avatar_url) || ''} alt={displayName} className={styles.avatar} />
            ) : (
              <div className={styles.avatarPlaceholder}>{displayName[0]?.toUpperCase()}</div>
            )}
          </div>

          <div className={styles.headerInfo}>
            <h1 className={styles.name}>{displayName}</h1>
            {profile.site_nickname && <p className={styles.username}>@{profile.discord_username}</p>}
            <div className={styles.rank}>{profile.forest_rank}</div>
            {profile.bio && <p className={styles.bio}>{profile.bio}</p>}
            {profile.joined_at && (
              <div className={styles.joined}>
                <Calendar size={13} />
                В лесу с {new Date(profile.joined_at).toLocaleDateString('ru-RU', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            )}

            <div className={styles.actions}>
              {!isOwnProfile && token && (
                <button
                  className={`${styles.friendBtn} ${friendStatus !== 'none' ? styles.friendBtnDisabled : ''}`}
                  onClick={sendFriendRequest}
                  disabled={friendLoading || friendStatus !== 'none'}
                >
                  <UserPlus size={15} />
                  {friendStatus === 'friends' ? 'Вы друзья' : friendStatus === 'pending' ? 'Заявка отправлена' : 'Добавить в друзья'}
                </button>
              )}
              <button className={styles.copyBtn} onClick={copyLink}>
                {copied ? <Check size={15} /> : <Copy size={15} />}
                {copied ? 'Скопировано' : 'Поделиться'}
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <Star size={20} className={styles.statIcon} />
            <div className={styles.statValue}>{profile.level}</div>
            <div className={styles.statLabel}>Уровень</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{profile.rating}</div>
            <div className={styles.statLabel}>Рейтинг</div>
          </div>
          <div className={styles.statCard}>
            <Trophy size={20} className={styles.statIcon} />
            <div className={styles.statValue}>{profile.tourney_stats?.played ?? 0}</div>
            <div className={styles.statLabel}>Турниров сыграно</div>
          </div>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{profile.tourney_stats?.wins ?? 0}</div>
            <div className={styles.statLabel}>Побед</div>
          </div>
        </div>

        {/* XP bar */}
        <div className={styles.xpCard}>
          <div className={styles.xpHeader}>
            <span>Опыт</span>
            <span>{profile.current_xp} / {(profile.level) * 100} XP</span>
          </div>
          <div className={styles.xpBar}>
            <div
              className={styles.xpFill}
              style={{ width: `${Math.min(100, (profile.current_xp / Math.max(1, profile.level * 100)) * 100)}%` }}
            />
          </div>
        </div>

      </div>
      <Footer />
    </>
  )
}
