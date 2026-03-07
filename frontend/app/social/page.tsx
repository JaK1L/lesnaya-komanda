'use client'

import { Navigation, Footer, SkipToContent } from '../../components/layout'
import { SocialCard } from '../../components/social'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

const socialLinks = [
  {
    name: 'Discord',
    description: 'Основная площадка нашего сообщества. Общение, игры, турниры!',
    url: 'https://discord.gg/YgX4RQZ',
    icon: '💬',
    followers: '150+',
    color: '#5865F2'
  },
  {
    name: 'Telegram',
    description: 'Новости, анонсы и быстрая связь с командой',
    url: 'https://t.me/lesnayakomanda',
    icon: '✈️',
    followers: '80+',
    color: '#0088cc'
  },
  {
    name: 'YouTube',
    description: 'Записи стримов, гайды, лучшие моменты и турниры',
    url: 'https://youtube.com/@lesnaya_komanda',
    icon: '📺',
    followers: '500+',
    color: '#FF0000'
  },
  {
    name: 'Twitch',
    description: 'Прямые трансляции игр от участников команды',
    url: 'https://twitch.tv/jak1lqa',
    icon: '🎮',
    followers: '200+',
    color: '#9146FF'
  },
  {
    name: 'GitHub',
    description: 'Открытый код нашего сайта и проектов',
    url: 'https://github.com/lesnaya-komanda',
    icon: '💻',
    followers: undefined,
    color: '#181717'
  }
]

export default function SocialPage() {
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
          <h1 className={styles.title}>МЫ В СОЦСЕТЯХ</h1>
          <p className={styles.subtitle}>
            Присоединяйся к нашему сообществу! Выбирай удобную платформу для общения
          </p>
        </div>

        <section className={styles.socialGrid}>
          {socialLinks.map((social, index) => (
            <SocialCard
              key={social.name}
              name={social.name}
              description={social.description}
              url={social.url}
              icon={social.icon}
              followers={social.followers}
              color={social.color}
              index={index}
            />
          ))}
        </section>

        <section className={styles.cta}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Не нашел нужную платформу?</h2>
            <p className={styles.ctaText}>
              Напиши нам в Discord, и мы обязательно рассмотрим возможность создания сообщества на других платформах!
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
