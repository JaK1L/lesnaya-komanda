'use client'

import { motion } from 'framer-motion'
import { Button } from '../ui/Button/Button'
import styles from './HeroSection.module.css'

interface HeroSectionProps {
  discordUrl: string
}

const TELEGRAM_URL = 'https://t.me/lesnayakomanda'
const STREAMS_URL = '/streams'

export function HeroSection({ discordUrl }: HeroSectionProps) {
  return (
    <section className={styles.hero}>
      <div className={styles.content}>
        <h1 className={styles.title}>LESNAYA</h1>
        <p className={styles.subtitle}>рисаживайся у костра чувак</p>
        <div className={styles.actions}>
          <Button href={STREAMS_URL} size="large">СТТЬ СТ</Button>
          <Button href={TELEGRAM_URL} target="_blank" rel="noreferrer" size="large">СТТЬ  Т</Button>
          <Button href={discordUrl} target="_blank" rel="noreferrer" size="large">СТТЬ  С</Button>
        </div>
      </div>
    </section>
  )
}
