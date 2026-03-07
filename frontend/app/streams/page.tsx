'use client'

import { Navigation, Footer, SkipToContent } from '../../components/layout'
import { StreamerCard } from '../../components/streamers'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const streamers = [
  {
    name: 'JaK1L',
    game: 'CS2, Dota 2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=JaK1L',
    platform: 'twitch' as const,
    url: 'https://twitch.tv/jak1l_stream',
    isLive: true,
    viewers: 234,
    schedule: undefined
  },
  {
    name: 'DIMA_DIMA',
    game: 'Valorant',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DIMA',
    platform: 'youtube' as const,
    url: 'https://youtube.com/@dima_dima',
    isLive: false,
    viewers: undefined,
    schedule: 'Пн, Ср, Пт в 19:00'
  },
  {
    name: 'Лесной_Дух',
    game: 'Dota 2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Spirit',
    platform: 'twitch' as const,
    url: 'https://twitch.tv/lesnoy_duh',
    isLive: false,
    viewers: undefined,
    schedule: 'Вт, Чт в 20:00'
  },
  {
    name: 'Снайпер',
    game: 'CS2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Sniper',
    platform: 'twitch' as const,
    url: 'https://twitch.tv/sniper_pro',
    isLive: true,
    viewers: 89,
    schedule: undefined
  },
  {
    name: 'Стрелок',
    game: 'Apex Legends',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Shooter',
    platform: 'youtube' as const,
    url: 'https://youtube.com/@strelok_gaming',
    isLive: false,
    viewers: undefined,
    schedule: 'Сб, Вс в 18:00'
  },
  {
    name: 'ProGamer',
    game: 'Valorant, CS2',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Pro',
    platform: 'twitch' as const,
    url: 'https://twitch.tv/progamer_lk',
    isLive: false,
    viewers: undefined,
    schedule: 'Каждый день в 21:00'
  }
]

export default function StreamsPage() {
  const liveStreamers = streamers.filter(s => s.isLive)
  const offlineStreamers = streamers.filter(s => !s.isLive)

  return (
    <>
      <SkipToContent />
      <Navigation
        apiUrl={API_URL}
        isAuthenticated={false}
        onLogout={() => {}}
      />
      
      <main className="container" id="main-content" tabIndex={-1}>
        <div className={styles.hero}>
          <h1 className={styles.title}>СТРИМЫ</h1>
          <p className={styles.subtitle}>
            Смотри прямые трансляции от участников команды. Учись, общайся, поддерживай!
          </p>
        </div>

        {liveStreamers.length > 0 && (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>
                <span className={styles.liveDot}></span>
                Сейчас в эфире
              </h2>
              <span className={styles.liveCount}>{liveStreamers.length} стрим(ов)</span>
            </div>
            <div className={styles.streamersGrid}>
              {liveStreamers.map((streamer, index) => (
                <StreamerCard
                  key={streamer.name}
                  name={streamer.name}
                  game={streamer.game}
                  avatar={streamer.avatar}
                  platform={streamer.platform}
                  url={streamer.url}
                  isLive={streamer.isLive}
                  viewers={streamer.viewers}
                  schedule={streamer.schedule}
                  index={index}
                />
              ))}
            </div>
          </section>
        )}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>Все стримеры</h2>
            <span className={styles.count}>{offlineStreamers.length} стримеров</span>
          </div>
          <div className={styles.streamersGrid}>
            {offlineStreamers.map((streamer, index) => (
              <StreamerCard
                key={streamer.name}
                name={streamer.name}
                game={streamer.game}
                avatar={streamer.avatar}
                platform={streamer.platform}
                url={streamer.url}
                isLive={streamer.isLive}
                viewers={streamer.viewers}
                schedule={streamer.schedule}
                index={index + liveStreamers.length}
              />
            ))}
          </div>
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Хочешь стать стримером команды?</h2>
            <p className={styles.ctaText}>
              Если ты активный участник сообщества и хочешь стримить от имени Лесной Команды, напиши нам в Discord!
            </p>
            <a 
              href="https://discord.gg/YgX4RQZ" 
              className={styles.ctaButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Написать в Discord
            </a>
          </div>
        </section>
        
        <Footer />
      </main>
    </>
  )
}
