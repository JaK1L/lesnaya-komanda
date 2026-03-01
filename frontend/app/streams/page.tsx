'use client'

import { TreePine } from 'lucide-react'

export default function StreamsPage() {
  return (
    <>
      {/* Навигация */}
      <nav className="nav">
        <div className="container nav-container">
          <a href="/" className="nav-logo">
            <TreePine size={32} />
            <span>ЛЕСНАЯ КОМАНДА</span>
          </a>
          <div className="nav-links">
            <a href="/" className="nav-link">ГЛАВНАЯ</a>
            <a href="/merch" className="nav-link">МЕРЧ</a>
            <a href="/streams" className="nav-link">СТРИМЫ</a>
            <a href="/social" className="nav-link">СОЦ.СЕТИ</a>
          </div>
        </div>
      </nav>

      <main className="container">
        <div className="hero-block">
          <h1>СТРИМЫ</h1>
          <p style={{ fontSize: '1.5rem', marginTop: '2rem' }}>Пока в разработке...</p>
        </div>

        {/* Footer */}
        <footer className="footer">
          <p>© 2026 ЛЕСНАЯ КОМАНДА. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</p>
        </footer>
      </main>
    </>
  )
}
