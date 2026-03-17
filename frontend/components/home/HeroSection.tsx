'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import Link from 'next/link'
import axios from 'axios'
import styles from './HeroSection.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const AUTOPLAY_MS = 6000

interface Event {
  id: number
  title: string
  description: string
  game: string | null
  event_date: string
  registered_count: number
  can_register: boolean
  telegram_url: string | null
  button_url: string | null
  button_label: string | null
}

interface HeroSectionProps {
  isAuthenticated?: boolean
  authResolved?: boolean
}

export function HeroSection({ isAuthenticated = false, authResolved = true }: HeroSectionProps) {
  const telegramWidgetRef = useRef<HTMLDivElement>(null)
  const [telegramPost, setTelegramPost] = useState<string>('lesnayakomanda/2')
  const [events, setEvents] = useState<Event[]>([])
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)
  const touchStartX = useRef(0)

  const totalSlides = 1 + events.length

  useEffect(() => {
    axios.get(`${API_URL}/api/telegram/latest-post`)
      .then(r => { if (r.data.success && r.data.widget_data) setTelegramPost(r.data.widget_data) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    axios.get(`${API_URL}/api/events/?upcoming_only=true`)
      .then(r => setEvents((r.data as Event[]).slice(0, 5)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const script = document.createElement('script')
    script.src = 'https://telegram.org/js/telegram-widget.js?22'
    script.setAttribute('data-telegram-post', telegramPost)
    script.setAttribute('data-width', '100%')
    script.setAttribute('data-userpic', 'true')
    script.setAttribute('data-dark', '1')
    script.async = true
    if (telegramWidgetRef.current) {
      telegramWidgetRef.current.innerHTML = ''
      telegramWidgetRef.current.appendChild(script)
    }
    return () => { if (telegramWidgetRef.current) telegramWidgetRef.current.innerHTML = '' }
  }, [telegramPost])

  const goTo = useCallback((i: number) => {
    setCurrent(((i % totalSlides) + totalSlides) % totalSlides)
  }, [totalSlides])

  const next = useCallback(() => setCurrent(c => ((c + 1) % totalSlides)), [totalSlides])
  const prev = useCallback(() => setCurrent(c => ((c - 1 + totalSlides) % totalSlides)), [totalSlides])

  useEffect(() => {
    if (paused) return
    const id = setInterval(next, AUTOPLAY_MS)
    return () => clearInterval(id)
  }, [paused, next])

  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX
    if (Math.abs(diff) > 50) diff > 0 ? next() : prev()
  }

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })

  const fmtTime = (s: string) =>
    new Date(s).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })

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

          <div className={styles.heroActions}>
            {authResolved && (
              <Link href={isAuthenticated ? "/profile" : "/register"} className={styles.btnHero}>
                {isAuthenticated ? 'Мой профиль' : 'Вступить в лес'}
                <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z" />
                </svg>
              </Link>
            )}

            <div className={styles.socialButtons}>
              <a href="https://twitch.tv/lesnayakomanda" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Twitch">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                </svg>
              </a>
              <a href="https://t.me/lesnayakomanda" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="Telegram">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                </svg>
              </a>
              <a href="https://tiktok.com/@lesnayakomanda" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="TikTok">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
                </svg>
              </a>
              <a href="https://youtube.com/@lesnayakomanda" target="_blank" rel="noopener noreferrer" className={styles.socialBtn} aria-label="YouTube">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>

        {/* Carousel */}
        <div
          className={styles.carousel}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          {/* Slides */}
          <div className={styles.slidesWrapper}>
            <div className={styles.slidesTrack} style={{ transform: `translateX(-${current * 100}%)` }}>

              {/* Slide 0: Telegram */}
              <div className={styles.slide}>
                <div ref={telegramWidgetRef} className={styles.widgetContainer} />
              </div>

              {/* Slides 1..N: one event per slide */}
              {events.map(ev => (
                <div key={ev.id} className={styles.slide}>
                  <div className={styles.eventCard}>
                    <div className={styles.eventCardHeader}>
                      {ev.game && <span className={styles.eventGame}>{ev.game}</span>}
                      {ev.can_register && <span className={styles.registerBadge}>Открыта запись</span>}
                    </div>

                    <div className={styles.eventCardBody}>
                      <h3 className={styles.eventCardTitle}>{ev.title}</h3>
                      {ev.description && (
                        <p className={styles.eventCardDesc}>{ev.description}</p>
                      )}
                    </div>

                    <div className={styles.eventCardFooter}>
                      <div className={styles.eventDateTime}>
                        <span className={styles.eventDateMain}>{fmtDate(ev.event_date)}</span>
                        <span className={styles.eventTime}>{fmtTime(ev.event_date)}</span>
                      </div>
                      <div className={styles.eventCardActions}>
                        <span className={styles.eventCount}>{ev.registered_count} чел.</span>
                        {ev.button_url && ev.button_label && (
                          <a href={ev.button_url} target="_blank" rel="noopener noreferrer" className={styles.eventActionBtn}>
                            {ev.button_label}
                          </a>
                        )}
                        {ev.telegram_url && (
                          <a href={ev.telegram_url} target="_blank" rel="noopener noreferrer" className={styles.eventTgLink}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z"/>
                            </svg>
                            Подробнее
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Controls: prev · dots · next */}
          <div className={styles.controls}>
            <button className={styles.arrowBtn} onClick={prev} aria-label="Предыдущий">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>
            </button>

            <div className={styles.dots}>
              {Array.from({ length: totalSlides }).map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                  onClick={() => goTo(i)}
                  aria-label={`Слайд ${i + 1}`}
                />
              ))}
            </div>

            <button className={styles.arrowBtn} onClick={next} aria-label="Следующий">
              <svg viewBox="0 0 24 24" fill="currentColor"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className={styles.heroGlow} aria-hidden="true" />
    </section>
  )
}
