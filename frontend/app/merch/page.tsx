'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { Package, ShoppingBag, Gift } from 'lucide-react'
import { Navigation } from '../../components/layout/Navigation'
import { Footer } from '../../components/layout/Footer'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

interface MerchItem {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  in_stock: boolean
  stock_quantity?: number
  sizes: string | null
}

interface ContactSettings {
  discord_url: string | null
  telegram_url: string | null
}

export default function MerchPage() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)
  const [contact, setContact] = useState<ContactSettings>({ discord_url: null, telegram_url: null })

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY))
    fetchMerch()
    axios.get<ContactSettings>(`${API_URL}/api/settings/contact`).then(r => setContact(r.data)).catch(() => {})
  }, [])

  const fetchMerch = async () => {
    try {
      setLoading(true)
      const res = await axios.get<MerchItem[]>(`${API_URL}/api/merch`)
      setItems(res.data)
    } catch { } finally { setLoading(false) }
  }

  return (
    <>
      <Navigation
        isAuthenticated={!!token}
        onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }}
        apiUrl={API_URL}
      />
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>МЕРЧ ЛЕСНОЙ КОМАНДЫ</h1>
          <p className={styles.subtitle}>Поддержи команду — выгляди как лесной боец</p>
        </div>

        {loading ? (
          <div className={styles.loading}><div className={styles.spinner} /></div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <Gift size={52} strokeWidth={1.5} />
            <p>Товары скоро появятся</p>
            <span>Мы работаем над запуском магазина. Следите за обновлениями!</span>
          </div>
        ) : (
          <div className={styles.grid}>
            {items.map(item => (
              <div key={item.id} className={styles.card}>
                <div className={styles.cardImg}>
                  {item.image_url
                    ? <img src={item.image_url} alt={item.name} />
                    : <div className={styles.imgPlaceholder}><Package size={40} strokeWidth={1.5} /></div>
                  }
                  {item.category && (
                    <span className={styles.badge}>{item.category}</span>
                  )}
                </div>
                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{item.name}</h3>
                  {item.description && <p className={styles.cardDesc}>{item.description}</p>}
                  {item.sizes && <p className={styles.sizes}>Размеры: {item.sizes}</p>}
                  <div className={styles.cardFooter}>
                    <span className={styles.price}>{item.price} ₽</span>
                    {(contact.telegram_url || contact.discord_url) && (
                      <a
                        href={(contact.telegram_url || contact.discord_url)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.buyBtn}
                      >
                        <ShoppingBag size={14} />
                        Заказать
                      </a>
                    )}
                  </div>
                  {item.stock_quantity !== undefined && item.stock_quantity < 10 && (
                    <div className={styles.stockWarning}>Осталось: {item.stock_quantity} шт.</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className={styles.cta}>
          <h2 className={styles.ctaTitle}>Как заказать?</h2>
          <p className={styles.ctaText}>
            Напиши нам — поможем с размером и доставкой по всей России
          </p>
          <div className={styles.ctaBtns}>
            {contact.telegram_url && (
              <a href={contact.telegram_url} target="_blank" rel="noopener noreferrer" className={styles.ctaBtn}>
                Написать в Telegram
              </a>
            )}
            {contact.discord_url && (
              <a href={contact.discord_url} target="_blank" rel="noopener noreferrer" className={`${styles.ctaBtn} ${styles.ctaBtnSecondary}`}>
                Написать в Discord
              </a>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  )
}
