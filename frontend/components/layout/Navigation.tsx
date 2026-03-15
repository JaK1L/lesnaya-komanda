'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import axios from 'axios'
import { LoginModal } from '../auth/LoginModal'
import Logo from '../Logo/Logo'
import { getProfileIdentifierFromProfileResponse, getProfileIdentifierFromToken } from '../../lib/profileIdentifier'
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
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const navRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const handleProfileClick = async () => {
    try {
      const token = localStorage.getItem('lesnaya_token')
      let profileIdentifier = getProfileIdentifierFromToken(token)

      if (token) {
        try {
          const res = await axios.get(`${API_URL}/api/profile`, {
            headers: { Authorization: `Bearer ${token}` },
          })
          const canonicalIdentifier = getProfileIdentifierFromProfileResponse(res.data)
          if (canonicalIdentifier) {
            profileIdentifier = canonicalIdentifier
          }
        } catch {
          // Use token fallback when canonical profile lookup fails.
        }
      }

      if (profileIdentifier) {
        router.push(`/profile/${encodeURIComponent(profileIdentifier)}`)
        return
      }
    } catch {
      // Fall back to generic profile route.
    }

    router.push('/profile')
  }

  const toggleMobileMenu = () => {
    setMobileMenuOpen(prev => !prev)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  const handleStreamsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    closeMobileMenu()
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
          closeMobileMenu()
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
    const handlePointerOutside = (e: PointerEvent) => {
      if (mobileMenuOpen && navRef.current && !navRef.current.contains(e.target as Node)) {
        closeMobileMenu()
      }
    }

    document.addEventListener('pointerdown', handlePointerOutside)
    return () => document.removeEventListener('pointerdown', handlePointerOutside)
  }, [mobileMenuOpen])

  return (
    <>
      <div className={styles.navWrapper} ref={navRef}>
        <nav className={styles.nav}>
          <div className={styles.container}>
            <Link href="/" className={styles.logo}>
              <Logo />
            </Link>

            <div className={styles.navLinks}>
              {NAV_ITEMS.map(item =>
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
                    onClick={closeMobileMenu}
                  >
                    {item.label}
                  </Link>
                )
              )}
            </div>

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

            <button
              className={styles.mobileMenuButton}
              onClick={toggleMobileMenu}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <div className={styles.mobileNavLinks}>
              {NAV_ITEMS.map(item =>
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
                    onClick={closeMobileMenu}
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
                      closeMobileMenu()
                      void handleProfileClick()
                    }}
                    className={`${styles.btn} ${styles.linkButton}`}
                  >
                    Профиль
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu()
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
                    onClick={closeMobileMenu}
                  >
                    Регистрация
                  </Link>
                  <button
                    onClick={() => {
                      closeMobileMenu()
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
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  )
}
