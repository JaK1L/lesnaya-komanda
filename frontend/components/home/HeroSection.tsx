'use client'

import { motion } from 'framer-motion'
import styles from './HeroSection.module.css'

interface HeroSectionProps {
  discordUrl: string
}

const STREAMS_URL = '/streams'

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: [0.22, 1, 0.36, 1],
    },
  },
}

export function HeroSection({ discordUrl }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={itemVariants}>
            <h1 className={styles.title}>Стримерское объединение</h1>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <p className={styles.subtitle}>
              Смотри стримы, следи за новостями и поддерживай любимых стримеров
            </p>
          </motion.div>

          <motion.div variants={itemVariants}>
            <a href={STREAMS_URL} className={styles.button}>
              Смотреть стримы
            </a>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
