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

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false)
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [mobileMenuOpen])

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
      <nav className={styles.nav} ref={navRef}>
        <div className={styles.container}>
          <a href="/" className={styles.logo}>
            L-KOMAND
          </a>

          <button
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'Закрыть меню' : 'Открыть меню'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.open : ''}`}>
            <a href="/team" className={styles.link}>Наша команда</a>
            <a href="/streams" className={styles.link}>Стримы</a>
            <a href="/about" className={styles.link}>О нас</a>
            <a href="/social" className={styles.link}>Соц. сети</a>
            <a href="/merch" className={styles.link}>Магазин</a>
          </div>

          <div className={styles.headerBtns}>
            {isAuthenticated ? (
              <>
                <a href="/profile" className={styles.loginButton}>Профиль</a>
                <button onClick={onLogout} className={styles.loginButton}>Выйти</button>
              </>
            ) : (
              <>
                <button onClick={() => handleOpenAuth('register')} className={styles.linkButton}>
                  Регистрация
                </button>
                <button onClick={() => handleOpenAuth('login')} className={styles.loginButton}>
                  Войти
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
