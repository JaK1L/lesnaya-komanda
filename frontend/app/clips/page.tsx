'use client'

import { Navigation, Footer } from '../../components/layout'
import { useState, useEffect } from 'react'
import styles from './page.module.css'

export default function ClipsPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('lesnaya_token')
    setIsAuthenticated(!!token)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('lesnaya_token')
    window.location.href = '/'
  }

  return (
    <>
      <Navigation
        isAuthenticated={isAuthenticated}
        onLogout={handleLogout}
        apiUrl={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}
      />

      <main className={styles.main}>
        <div className={styles.container}>
          <h1 className={styles.title}>🎬 Клипы</h1>
          <p className={styles.subtitle}>Скоро здесь появятся лучшие моменты со стримов</p>
          
          <div className={styles.comingSoon}>
            <div className={styles.icon}>🎥</div>
            <p>Раздел в разработке</p>
          </div>
        </div>
      </main>

      <Footer />
    </>
  )
}
