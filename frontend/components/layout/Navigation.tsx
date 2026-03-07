'use client'

import { useState } from 'react'
import { TreePine, Menu, X } from 'lucide-react'
import { Button } from '../ui/Button/Button'
import styles from './Navigation.module.css'

interface NavigationProps {
  isAuthenticated: boolean
  onLogout: () => void
  apiUrl: string
}

export function Navigation({ isAuthenticated, onLogout, apiUrl }: NavigationProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  return (
    <nav className={styles.nav}>
      <div className={styles.container}>
        <a href="/" className={styles.logo}>
          <TreePine size={32} />
          <span>LESNAYA KOMANDA</span>
        </a>

        <button
          className={styles.mobileMenuButton}
          onClick={toggleMobileMenu}
          aria-label="Открыть меню"
          aria-expanded={mobileMenuOpen}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        <div className={`${styles.links} ${mobileMenuOpen ? styles.open : ''}`}>
          <a href="/" className={styles.link}>
            Главная
          </a>
          <a href="/streams" className={styles.link}>
            Стримеры
          </a>
          <a href="/social" className={styles.link}>
            Команда
          </a>
          <a href="/merch" className={styles.link}>
            Магазин
          </a>

          {isAuthenticated ? (
            <>
              <a href="/profile" className={styles.link}>
                Профиль
              </a>
              <Button onClick={onLogout} size="small">
                Выйти
              </Button>
            </>
          ) : (
            <Button href={`${apiUrl}/api/auth/discord`} size="small">
              Войти
            </Button>
          )}
        </div>
      </div>
    </nav>
  )
}
