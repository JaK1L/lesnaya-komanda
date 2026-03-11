'use client'

import { Navigation } from '../../components/layout/Navigation'
import { Footer } from '../../components/layout/Footer'
import styles from './page.module.css'

export default function AboutPage() {
  return (
    <>
      <Navigation />
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>🌲 О Лесной Команде</h1>
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
              <div className={styles.feature}>
                <div className={styles.featureIcon}>🎮</div>
                <h3>Совместные игры</h3>
                <p>Регулярные игровые сессии в различных играх</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>🏆</div>
                <h3>Турниры</h3>
                <p>Внутренние и открытые турниры с призами</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>📺</div>
                <h3>Стримы</h3>
                <p>Обучающие и развлекательные трансляции</p>
              </div>
              <div className={styles.feature}>
                <div className={styles.featureIcon}>💬</div>
                <h3>Общение</h3>
                <p>Активное комьюнити в Discord</p>
              </div>
            </div>
          </section>

          <section className={styles.section}>
            <h2>Присоединяйся!</h2>
            <p>
              Хочешь стать частью Лесной Команды? Присоединяйся к нашему Discord серверу 
              и начни играть вместе с нами уже сегодня!
            </p>
            <a 
              href="https://discord.gg/YgX4RQZ" 
              target="_blank" 
              rel="noopener noreferrer"
              className={styles.discordButton}
            >
              <span>💬</span> Присоединиться к Discord
            </a>
          </section>
        </div>
      </div>
      <Footer />
    </>
  )
}
