'use client'

import { Navigation } from '../../components/layout/Navigation'
import { Footer } from '../../components/layout/Footer'
import styles from './page.module.css'

export default function SocialPage() {
  const socials = [
    {
      name: 'Discord',
      icon: '💬',
      description: 'Основная площадка нашего сообщества',
      url: 'https://discord.gg/YgX4RQZ',
      color: '#5865F2'
    },
    {
      name: 'Telegram',
      icon: '✈️',
      description: 'Новости и анонсы событий',
      url: 'https://t.me/lesnayakomanda',
      color: '#0088cc'
    },
    {
      name: 'Twitch',
      icon: '📺',
      description: 'Стримы наших игроков',
      url: 'https://twitch.tv/lesnayakomanda',
      color: '#9146FF'
    },
    {
      name: 'YouTube',
      icon: '🎥',
      description: 'Записи стримов и highlights',
      url: 'https://youtube.com/@lesnayakomanda',
      color: '#FF0000'
    },
    {
      name: 'VK',
      icon: '🔵',
      description: 'Сообщество ВКонтакте',
      url: 'https://vk.com/lesnayakomanda',
      color: '#0077FF'
    },
    {
      name: 'TikTok',
      icon: '🎵',
      description: 'Короткие видео и моменты',
      url: 'https://tiktok.com/@lesnayakomanda',
      color: '#000000'
    }
  ]

  return (
    <>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>🌐 Мы в соцсетях</h1>
          <p className={styles.subtitle}>Следите за новостями и событиями Лесной Команды</p>
        </div>

        <div className={styles.content}>
          <div className={styles.socialsGrid}>
            {socials.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialCard}
                style={{ borderColor: social.color }}
              >
                <div className={styles.socialIcon} style={{ background: social.color }}>
                  {social.icon}
                </div>
                <h3 className={styles.socialName}>{social.name}</h3>
                <p className={styles.socialDescription}>{social.description}</p>
                <div className={styles.socialLink}>
                  Перейти →
                </div>
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
