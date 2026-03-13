'use client'

import { useState, useEffect } from 'react'
import { Gamepad2, Trophy, Tv, MessageCircle } from 'lucide-react'
import { Navigation } from '../../components/layout/Navigation'
import { Footer } from '../../components/layout/Footer'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

const FEATURES = [
  { Icon: Gamepad2, title: 'Совместные игры', desc: 'Регулярные игровые сессии в различных играх' },
  { Icon: Trophy, title: 'Турниры', desc: 'Внутренние и открытые турниры с призами' },
  { Icon: Tv, title: 'Стримы', desc: 'Обучающие и развлекательные трансляции' },
  { Icon: MessageCircle, title: 'Общение', desc: 'Активное комьюнити в Discord' },
]

export default function AboutPage() {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY))
  }, [])

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>О Лесной Команде</h1>
          <p className={styles.subtitle}>Игровое сообщество, объединяющее людей</p>
        </div>

        <div className={styles.content}>
          <section className={styles.section}>
            <h2>Кто мы?</h2>
            <p>
              Лесная Команда — это дружное игровое сообщество, где каждый может найти единомышленников
              для совместной игры, общения и участия в турнирах. Мы играем в CS2, Dota 2, Valorant и многие другие игры.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Наша миссия</h2>
            <p>
              Создать комфортное пространство для геймеров всех уровней — от новичков до профессионалов.
              Мы организуем турниры, проводим обучающие стримы и просто весело проводим время вместе.
            </p>
          </section>

          <section className={styles.section}>
            <h2>Что мы предлагаем?</h2>
            <div className={styles.features}>
              {FEATURES.map(({ Icon, title, desc }) => (
                <div key={title} className={styles.feature}>
                  <div className={styles.featureIcon}><Icon size={36} /></div>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <section className={styles.section}>
            <h2>Присоединяйся!</h2>
            <p>
              Хочешь стать частью Лесной Команды? Присоединяйся к нашему Discord серверу
              и начни играть вместе с нами уже сегодня!
            </p>
            <a href="https://discord.gg/YgX4RQZ" target="_blank" rel="noopener noreferrer" className={styles.discordButton}>
              <MessageCircle size={22} /> Присоединиться к Discord
            </a>
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}
