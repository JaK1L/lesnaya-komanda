'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Twitch, Youtube } from 'lucide-react'
import { getImageUrl } from '../../lib/imageUtils'
import { Navigation, Footer } from '../../components/layout'
import styles from './page.module.css'

interface TeamMember {
  discord_id: number
  discord_username: string
  real_name?: string
  avatar_url?: string
  bio?: string
  forest_rank: string
  team_role?: string
  twitch_username?: string
  telegram_url?: string
  tiktok_url?: string
  youtube_url?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY))
    fetchTeamMembers()
  }, [])

  const fetchTeamMembers = async () => {
    try {
      setLoading(true)
      const response = await axios.get<TeamMember[]>(`${API_URL}/api/team`)
      setMembers(response.data)
    } catch (err) {
      console.error('Error fetching team members:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Наша команда</h1>
          <p className={styles.subtitle}>Познакомьтесь с участниками Лесной Команды</p>
        </div>

        {loading && <div className={styles.loading}>Загрузка...</div>}
        {!loading && members.length === 0 && (
          <div className={styles.empty}>Информация о команде скоро появится</div>
        )}

        <div className={styles.grid}>
          {members.map((member) => (
            <div key={member.discord_id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div className={styles.avatar}>
                  {member.avatar_url ? (
                    <img src={getImageUrl(member.avatar_url) || ''} alt={member.discord_username} />
                  ) : (
                    <div className={styles.avatarPlaceholder}>
                      {member.discord_username[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.cardInfo}>
                  <h3 className={styles.cardName}>{member.real_name || member.discord_username}</h3>
                  {member.real_name && <p className={styles.cardNickname}>@{member.discord_username}</p>}
                  <p className={styles.cardRole}>{member.team_role || 'Участник команды'}</p>
                </div>
              </div>

              {member.bio && <p className={styles.cardBio}>{member.bio}</p>}

              <div className={styles.cardSocials}>
                {member.twitch_username && (
                  <a href={`https://twitch.tv/${member.twitch_username}`} target="_blank" rel="noopener noreferrer"
                    className={styles.socialLink} aria-label="Twitch">
                    <Twitch size={20} />
                  </a>
                )}
                {member.telegram_url && (
                  <a href={member.telegram_url} target="_blank" rel="noopener noreferrer"
                    className={styles.socialLink} aria-label="Telegram">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                    </svg>
                  </a>
                )}
                {member.tiktok_url && (
                  <a href={member.tiktok_url} target="_blank" rel="noopener noreferrer"
                    className={styles.socialLink} aria-label="TikTok">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                    </svg>
                  </a>
                )}
                {member.youtube_url && (
                  <a href={member.youtube_url} target="_blank" rel="noopener noreferrer"
                    className={styles.socialLink} aria-label="YouTube">
                    <Youtube size={20} />
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </>
  )
}
