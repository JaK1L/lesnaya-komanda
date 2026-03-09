'use client'

import { motion } from 'framer-motion'
import styles from './HeroSection.module.css'

export function HeroSection() {
  return (
    <section className={styles.hero}>
      <div className={styles.container}>
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className={styles.heroContent}>
            <h1 className={styles.title}>
              Объединение <br />
              главных стримеров ЛЕСНОЙ КОМАНДЫ
            </h1>
            <p className={styles.subtitle}>
              Смотри стримы, следи за новостями и будь частью леса. 
              Всё в одном месте — без лишних кликов.
            </p>
            <div className={styles.buttons}>
              <a href="/streams" className={styles.btnPrimary}>
                <i className="fas fa-play"></i>
                Смотреть эфиры
              </a>
              <a href="/#news" className={styles.btnOutline}>
                <i className="fas fa-newspaper"></i>
                Новости
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
