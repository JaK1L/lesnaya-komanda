'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import styles from './HeroSection.module.css'

export function HeroSection() {
  const telegramWidgetRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Загружаем Telegram Widget скрипт
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    // Укажи ID последнего поста из твоего канала (например, если URL поста https://t.me/lesnayakomanda/123, то ID = 123)
    // Для автоматического обновления можно указать ID любого недавнего поста
    script.setAttribute('data-telegram-post', 'lesnayakomanda/2') // Замени 2 на ID последнего поста
    script.setAttribute('data-width', '100%')
    script.setAttribute('data-userpic', 'false')
    script.setAttribute('data-dark', '1')
    script.async = true

    if (telegramWidgetRef.current) {
      telegramWidgetRef.current.appendChild(script)
    }

    return () => {
      if (telegramWidgetRef.current) {
        telegramWidgetRef.current.innerHTML = ''
      }
    }
  }, [])

  return (
    <section className={styles.hero} id="hero">
      <div className={styles.heroContent}>
        {/* Tagline */}
        <div className={styles.heroTagline}>
          <h1>Мы прокладываем миллион и тысячу новых путей</h1>
          <p>
            Смотри стримы, следи за новостями и будь частью леса.
            Всё в одном месте — без лишних кликов.
          </p>

          {/* CTA + Social */}
          <div className={styles.heroActions}>
            <Link href="/register" className={styles.btnHero}>
              Вступить в лес
              <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
              </svg>
            </Link>

            <div className={styles.socialButtons}>
              <a
                href="https://twitch.tv/lesnayakomanda"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label="Twitch"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </a>
              <a
                href="https://t.me/lesnayakomanda"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label="Telegram"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
              </a>
              <a
                href="https://tiktok.com/@lesnayakomanda"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label="TikTok"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a
                href="https://youtube.com/@lesnayakomanda"
                target="_blank"
                rel="noopener noreferrer"
                className={styles.socialBtn}
                aria-label="YouTube"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Telegram Widget */}
        <div className={styles.telegramWidget}>
          <div ref={telegramWidgetRef} className={styles.widgetContainer} />
        </div>
      </div>

      {/* Ambient glow */}
      <div className={styles.heroGlow} aria-hidden="true" />
    </section>
  )
}
