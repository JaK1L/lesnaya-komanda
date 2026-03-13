'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Navigation, Footer } from '../../components/layout'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface MerchItem {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  sizes: string | null
}

export default function MerchPage() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMerch()
  }, [])

  const fetchMerch = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get<MerchItem[]>(`${API_URL}/api/merch`)
      setItems(response.data)
    } catch (err) {
      console.error('Error fetching merch:', err)
      setError('Не удалось загрузить товары')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <>
        <Navigation
          apiUrl={API_URL}
          isAuthenticated={false}
          onLogout={() => {}}
        />
        <main className="container">
          <div className={styles.loading}>Загрузка товаров...</div>
          <Footer />
        </main>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Navigation
          apiUrl={API_URL}
          isAuthenticated={false}
          onLogout={() => {}}
        />
        <main className="container">
          <div className={styles.error}>{error}</div>
          <Footer />
        </main>
      </>
    )
  }

  return (
    <>
      <SkipToContent />
      <Navigation
        apiUrl={API_URL}
        isAuthenticated={false}
        onLogout={() => {}}
      />
      
      <main className="container">
        <div className={styles.hero}>
          <h1 className={styles.title}>МАГАЗИН</h1>
          <p className={styles.subtitle}>
            Официальный мерч Лесной Команды. Поддержи команду стильно!
          </p>
        </div>

        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>Товаров пока нет</p>
            <p style={{ fontSize: '1rem', marginTop: '1rem' }}>
              Скоро здесь появится крутой мерч!
            </p>
          </div>
        ) : (
          <section className={styles.section}>
            <div className={styles.grid}>
              {items.map((item) => (
                <div key={item.id} className={styles.card}>
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      className={styles.cardImage}
                    />
                  )}
                  <div className={styles.cardContent}>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    {item.description && (
                      <p className={styles.cardDescription}>{item.description}</p>
                    )}
                    <div className={styles.cardFooter}>
                      <span className={styles.price}>{item.price.toFixed(2)} ₽</span>
                      {item.sizes && (
                        <span className={styles.sizes}>Размеры: {item.sizes}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className={styles.cta}>
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>Как заказать?</h2>
            <p className={styles.ctaText}>
              Для заказа товаров напиши нам в Discord. Мы поможем с выбором размера и оформлением заказа!
            </p>
            <a 
              href="https://discord.gg/YgX4RQZ" 
              className={styles.ctaButton}
              target="_blank"
              rel="noopener noreferrer"
            >
              Написать в Discord
            </a>
          </div>
        </section>
        
        <Footer />
      </main>
    </>
  )
}
