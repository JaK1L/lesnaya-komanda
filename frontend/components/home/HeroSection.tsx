'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/Button/Button'
import styles from './HeroSection.module.css'

interface HeroSectionProps {
  discordUrl: string
}

// Анимация с stagger эффектом
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
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
            <h1 className={styles.title}>LESNAYA</h1>
          </motion.div>
          
          <motion.div variants={itemVariants}>
            <p className={styles.subtitle}>
              Присаживайся у костра чувак
            </p>
          </motion.div>

          <motion.div 
            variants={itemVariants}
            style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}
          >
            <div className={styles.actions}>
              <Button 
                href={discordUrl}
                target="_blank"
                rel="noreferrer"
                size="large"
              >
                СМОТРЕТЬ СТРИМ
              </Button>
              
              <Button 
                href={discordUrl}
                target="_blank"
                rel="noreferrer"
                size="large"
              >
                ВСТУПИТЬ TELEGRAM
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
