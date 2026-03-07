'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/Button/Button'
import styles from './HeroSection.module.css'

interface HeroSectionProps {
  discordUrl: string
}

export function HeroSection({ discordUrl }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div className={styles.content}>
          <h1 className={styles.title}>LESNAYA</h1>
          
          <p className={styles.subtitle}>
            Добро пожаловать в цифровой лес
          </p>

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
        </div>
      </motion.div>
    </section>
  )
}
