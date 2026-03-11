'use client'

import { useEffect, useState } from 'react'
import axios from 'axios'
import styles from './page.module.css'

interface MerchItem {
  id: number
  name: string
  description?: string
  price: number
  image_url?: string
  category?: string
  sizes?: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function ShopPage() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMerch()
  }, [])

  const fetchMerch = async () => {
    try {
      setLoading(true)
      const response = await axios.get<MerchItem[]>(`${API_URL}/api/merch`)
      setItems(response.data)
    } catch (err) {
      console.error('Error fetching merch:', err)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <h1 className={styles.title}>Магазин</h1>
          <p className={styles.subtitle}>Мерч Лесной Команды</p>
        </div>
        <div className={styles.loading}>Загрузка...</div>
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Магазин</h1>
        <p className={styles.subtitle}>Мерч Лесной Команды</p>
      </div>

      {items.length === 0 ? (
        <div className={styles.empty}>
          <p>Товары скоро появятся</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {items.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardImage}>
                {item.image_url ? (
                  <img src={item.image_url} alt={item.name} />
                ) : (
                  <div className={styles.imagePlaceholder}>
                    <span>🛍️</span>
                  </div>
                )}
              </div>
              
              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{item.name}</h3>
                {item.description && (
                  <p className={styles.cardDescription}>{item.description}</p>
                )}
                
                <div className={styles.cardFooter}>
                  <div className={styles.price}>{item.price} ₽</div>
                  {item.sizes && (
                    <div className={styles.sizes}>Размеры: {item.sizes}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
