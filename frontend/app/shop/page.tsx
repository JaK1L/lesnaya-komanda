'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import { ShoppingBag, Gift, Package } from 'lucide-react'
import { Navigation } from '../../components/layout/Navigation'
import { Footer } from '../../components/layout/Footer'
import styles from './page.module.css'

interface MerchItem {
  id: number
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  in_stock: boolean
  stock_quantity?: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const TOKEN_KEY = 'lesnaya_token'

export default function ShopPage() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    setToken(localStorage.getItem(TOKEN_KEY))
    fetchMerch()
  }, [])

  const fetchMerch = async () => {
    try {
      setLoading(true)
      const response = await axios.get<MerchItem[]>(`${API_URL}/api/merch`)
      setItems(response.data.filter(item => item.in_stock))
    } catch (err) {
      console.error('Error fetching merch:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <Navigation isAuthenticated={!!token} onLogout={() => { localStorage.removeItem(TOKEN_KEY); setToken(null) }} apiUrl={API_URL} />
      <div className={styles.container}>
        <div className={styles.hero}>
          <h1 className={styles.title}>Магазин мерча</h1>
          <p className={styles.subtitle}>Официальный мерч Лесной Команды</p>
        </div>

        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner}></div>
            <p>Загрузка товаров...</p>
          </div>
        ) : items.length === 0 ? (
          <div className={styles.empty}>
            <div className={styles.emptyIcon}><Gift size={48} /></div>
            <h2>Товары скоро появятся</h2>
            <p>Мы работаем над запуском магазина. Следите за новостями!</p>
          </div>
        ) : (
          <div className={styles.content}>
            <div className={styles.grid}>
              {items.map((item) => (
                <div key={item.id} className={styles.card}>
                  <div className={styles.cardImage}>
                    {item.image_url ? (
                      <img src={item.image_url} alt={item.name} />
                    ) : (
                      <div className={styles.imagePlaceholder}>
                        <Package size={40} />
                      </div>
                    )}
                  </div>
                  <div className={styles.cardBody}>
                    <div className={styles.cardCategory}>{item.category || 'Мерч'}</div>
                    <h3 className={styles.cardTitle}>{item.name}</h3>
                    {item.description && <p className={styles.cardDescription}>{item.description}</p>}
                    <div className={styles.cardFooter}>
                      <div className={styles.price}>{item.price} ₽</div>
                      <button className={styles.buyButton}>
                        <ShoppingBag size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} />
                        Купить
                      </button>
                    </div>
                    {item.stock_quantity !== undefined && item.stock_quantity < 10 && (
                      <div className={styles.stockWarning}>Осталось: {item.stock_quantity} шт.</div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <section className={styles.info}>
              <h2>Информация о доставке</h2>
              <p>Доставка осуществляется по всей России. Стоимость и сроки доставки рассчитываются индивидуально при оформлении заказа.</p>
              <p>По вопросам заказа обращайтесь в наш Discord или Telegram.</p>
            </section>
          </div>
        )}
      </div>
      <Footer />
    </>
  )
}
