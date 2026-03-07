'use client'

import { useState, useEffect, useRef } from 'react'
import { TreePine, Menu, X } from 'lucide-react'
import { Button } from '../ui/Button/Button'
import { Icon } from '../ui/Icon'
import styles from './Navigation.module.css'

interface NavigationProps {
  isAuthenticated: boolean
  onLogout: () => void
  apiUrl: string
}

export function Navigation({ isAuthenticated, onLogout, apiUrl }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  // Закрытие меню по ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [mobileMenuOpen])

  // Закрытие меню при клике вне его
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node) && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [mobileMenuOpen])

  return (
    <nav className={styles.nav} ref={navRef} aria-label="Основная навигация">
      <div className={styles.container}>
        <a href="/" className={styles.logo} aria-label="Lesnaya Komanda - Главная страница">
          <TreePine size={32} aria-hidden="true" />
          <span>LESNAYA KOMANDA</span>
        </a>

        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          aria-expanded={mobileMenuOpen}
          aria-controls="main-navigation"
        >
          {mobileMenuOpen ? <X size={24} aria-hidden="true" /> : <Menu size={24} aria-hidden="true" />}
        </button>

        <div 
          id="main-navigation"
          className={`${styles.links} ${mobileMenuOpen ? styles.open : ''}`}
          role="navigation"
        >
          <a href="/" className={styles.link}>
            <Icon name="home" size="small" />
            <span>Главная</span>
          </a>
          <a href="/streams" className={styles.link}>
            <Icon name="streams" size="small" />
            <span>Стримеры</span>
          </a>
          <a href="/social" className={styles.link}>
            <Icon name="team" size="small" />
            <span>Команда</span>
          </a>
          <a href="/merch" className={styles.link}>
            <Icon name="trophy" size="small" />
            <span>Магазин</span>
          </a>

          {isAuthenticated ? (
            <>
              <a href="/profile" className={styles.link}>
                <Icon name="profile" size="small" />
                <span>Профиль</span>
              </a>
              <Button onClick={onLogout} size="small" aria-label="Выйти из аккаунта">
                Выйти
              </Button>
            </>
          ) : (
            <Button href={`${apiUrl}/api/auth/discord`} size="small" aria-label="Войти через Discord">
              <Icon name="discord" size="small" />
              <span>Войти</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
