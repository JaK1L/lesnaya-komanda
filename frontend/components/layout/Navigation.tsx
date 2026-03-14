'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Menu, X } from 'lucide-react'
import { LoginModal } from '../auth/LoginModal'
import Logo from '../Logo/Logo'
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

function getDiscordIdFromToken(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const t = localStorage.getItem('lesnaya_token')
    if (!t) return null
    return String(JSON.parse(atob(t.split('.')[1])).discord_id ?? '')
  } catch { return null }
}

export function Navigation({ isAuthenticated, onLogout }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [discordId, setDiscordId] = useState<string | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    if (isAuthenticated) setDiscordId(getDiscordIdFromToken())
  }, [isAuthenticated])

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
          <div className={`${styles.navLinks} ${mobileMenuOpen ? styles.open : ''}`}>
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

          {/* Auth Buttons */}
          <div className={styles.headerBtns}>
            {isAuthenticated ? (
              <>
                <Link href={discordId ? `/profile/${discordId}` : '/profile'} className={`${styles.btn} ${styles.linkButton}`}>
                  Профиль
                </Link>
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

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={handleLoginSuccess}
      />
    </>
  )
}
