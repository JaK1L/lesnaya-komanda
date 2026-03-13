'use client'

import { useState, useEffect } from 'react'
import { Twitch, Youtube, Send, MessageCircle, Globe, Music2 } from 'lucide-react'
import { Navigation } from '../../components/layout/Navigation'
import { Footer } from '../../components/layout/Footer'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

const socials = [
  { name: 'Discord', Icon: MessageCircle, description: 'Основная площадка нашего сообщества', url: 'https://discord.gg/YgX4RQZ', color: '#5865F2' },
  { name: 'Telegram', Icon: Send, description: 'Новости и анонсы событий', url: 'https://t.me/lesnayakomanda', color: '#0088cc' },
  { name: 'Twitch', Icon: Twitch, description: 'Стримы наших игроков', url: 'https://twitch.tv/lesnayakomanda', color: '#9146FF' },
  { name: 'YouTube', Icon: Youtube, description: 'Записи стримов и highlights', url: 'https://youtube.com/@lesnayakomanda', color: '#FF0000' },
  { name: 'VK', Icon: Globe, description: 'Сообщество ВКонтакте', url: 'https://vk.com/lesnayakomanda', color: '#0077FF' },
  { name: 'TikTok', Icon: Music2, description: 'Короткие видео и моменты', url: 'https://tiktok.com/@lesnayakomanda', color: '#000000' },
]

export default function SocialPage() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY))
  }, [])

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Мы в соцсетях</h1>
          <p className={styles.subtitle}>Следите за новостями и событиями Лесной Команды</p>
        </div>

        <div className={styles.content}>
          <div className={styles.socialsGrid}>
            {socials.map(({ name, Icon, description, url, color }) => (
              <a key={name} href={url} target="_blank" rel="noopener noreferrer"
                className={styles.socialCard} style={{ borderColor: color }}>
                <div className={styles.socialIcon} style={{ background: color }}>
                  <Icon size={32} color="#fff" />
                </div>
                <h3 className={styles.socialName}>{name}</h3>
                <p className={styles.socialDescription}>{description}</p>
                <div className={styles.socialLink}>Перейти →</div>
              </a>
            ))}
          </div>

          <section className={styles.callToAction}>
            <h2>Не пропускай важное!</h2>
            <p>
              Подпишись на наши социальные сети, чтобы быть в курсе всех новостей,
              анонсов турниров и получать эксклюзивный контент от команды.
            </p>
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}
