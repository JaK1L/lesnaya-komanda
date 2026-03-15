'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { LoginModal } from '../auth/LoginModal'
import Logo from '../Logo/Logo'
import { getProfileIdentifierFromToken } from '../../lib/profileIdentifier'
import styles from './Navigation.module.css'

interface NavigationProps {
  isAuthenticated: boolean
  onLogout: () => void
  apiUrl: string
}

const NAV_ITEMS = [
  { label: 'Наша команда', href: '/team' },
  { label: 'Стримы', href: '#streams' },
  { label: 'Турниры', href: '/tournaments' },
  { label: 'Медиа', href: '/media' },
  { label: 'О нас', href: '/about' },
  { label: 'Соц. сети', href: '/social' },
  { label: 'Мерч', href: '/merch' },
]

export function Navigation({ isAuthenticated, onLogout }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const handleProfileClick = () => {
    try {
      const t = localStorage.getItem('lesnaya_token')
      const profileIdentifier = getProfileIdentifierFromToken(t)
      if (profileIdentifier) {
        router.push(`/profile/${encodeURIComponent(profileIdentifier)}`)
        return
      }
    } catch { /* ignore */ }
    router.push('/profile')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const handleStreamsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    setMobileMenuOpen(false)
    if (pathname === '/') {
      document.getElementById('streams')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push('/streams')
    }
  }

  const handleLoginSuccess = () => {
    setLoginModalOpen(false)
    window.location.reload()
  }

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (loginModalOpen) {
          setLoginModalOpen(false)
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false)
        }
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [mobileMenuOpen, loginModalOpen])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
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
          {/* Logo */}
          <Link href="/" className={styles.logo}>
            <Logo />
          </Link>

          {/* Desktop Navigation */}
          <div className={styles.navLinks}>
            {NAV_ITEMS.map((item) =>
              item.label === 'Стримы' ? (
                <a
                  key="streams"
                  href="#"
                  className={styles.link}
                  onClick={handleStreamsClick}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={item.href}
                  href={item.href}
                  className={styles.link}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          {/* Desktop Auth Buttons */}
          <div className={styles.headerBtns}>
            {isAuthenticated ? (
              <>
                <button onClick={handleProfileClick} className={`${styles.btn} ${styles.linkButton}`}>
                  Профиль
                </button>
                <button onClick={onLogout} className={`${styles.btn} ${styles.loginButton}`}>
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link href="/register" className={`${styles.btn} ${styles.linkButton}`}>
                  Регистрация
                </Link>
                <button 
                  onClick={() => setLoginModalOpen(true)} 
                  className={`${styles.btn} ${styles.loginButton}`}
                >
                  Войти
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className={styles.mobileMenuButton}
            onClick={toggleMobileMenu}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {mobileMenuOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileNavLinks}>
            {NAV_ITEMS.map((item) =>
              item.label === 'Стримы' ? (
                <a
                  key="mobile-streams"
                  href="#"
                  className={styles.mobileLink}
                  onClick={handleStreamsClick}
                >
                  {item.label}
                </a>
              ) : (
                <Link
                  key={`mobile-${item.href}`}
                  href={item.href}
                  className={styles.mobileLink}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              )
            )}
          </div>

          <div className={styles.mobileAuth}>
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleProfileClick()
                  }}
                  className={`${styles.btn} ${styles.linkButton}`}
                >
                  Профиль
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    onLogout()
                  }}
                  className={`${styles.btn} ${styles.loginButton}`}
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/register"
                  className={`${styles.btn} ${styles.linkButton}`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Регистрация
                </Link>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    setLoginModalOpen(true)
                  }}
                  className={`${styles.btn} ${styles.loginButton}`}
                >
                  Войти
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  )
}
