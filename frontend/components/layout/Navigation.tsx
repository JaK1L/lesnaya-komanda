'use client'

import { useState, useEffect, useRef } from 'react'
import { Menu, X } from 'lucide-react'
import { AuthModal } from '../auth'
import styles from './Navigation.module.css'

interface NavigationProps {
  isAuthenticated: boolean
  onLogout: () => void
  apiUrl: string
}

export function Navigation({ isAuthenticated, onLogout, apiUrl }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login')
  const navRef = useRef<HTMLDivElement>(null)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleOpenAuth = (mode: 'login' | 'register') => {
    setAuthMode(mode)
    setAuthModalOpen(true)
    setMobileMenuOpen(false)
  }

  const handleAuthSuccess = () => {
    window.location.reload()
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
    <>
      <nav className={styles.nav} ref={navRef} aria-label="Основная навигация">
        <div className={styles.container}>
          <a href="/" className={styles.logo} aria-label="Lesnaya Komanda - Главная страница">
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
            className={`${styles.navLinks} ${mobileMenuOpen ? styles.open : ''}`}
            role="navigation"
          >
            <a href="/streams" className={styles.link}>
              Стримеры
            </a>
            <a href="/clips" className={styles.link}>
              Клипы
            </a>
            <a href="/social" className={styles.link}>
              Соцсети
            </a>

            {isAuthenticated ? (
              <>
                <a href="/profile" className={styles.link}>
                  Профиль
                </a>
                <button onClick={onLogout} className={styles.loginButton} aria-label="Выйти из аккаунта">
                  Выйти
                </button>
              </>
            ) : (
              <>
                <button 
                  onClick={() => handleOpenAuth('login')} 
                  className={styles.loginButton}
                  aria-label="Войти"
                >
                  Войти
                </button>
                <button 
                  onClick={() => handleOpenAuth('register')} 
                  className={styles.linkButton}
                  aria-label="Регистрация"
                >
                  Регистрация
                </button>
              </>
            )}
          </div>
        </div>
      </nav>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
        apiUrl={apiUrl}
        initialMode={authMode}
      />
    </>
  )
}
