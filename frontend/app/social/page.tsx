'use client'

import { Navigation, Footer, SkipToContent } from '../../components/layout'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function SocialPage() {
  return (
    <>
      <SkipToContent />
      <Navigation
        apiUrl={API_URL}
        isAuthenticated={false}
        onLogout={() => {}}
      />
      
      <main className="container" id="main-content" tabIndex={-1}>
        <div className="hero-block">
          <h1>СОЦ.СЕТИ</h1>
          <p style={{ fontSize: '1.5rem', marginTop: '2rem' }}>
            Пока в разработке...
          </p>
        </div>
        
        <Footer />
      </main>
    </>
  )
}
