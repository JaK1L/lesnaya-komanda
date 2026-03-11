'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MerchModal } from '../../../components/admin/MerchModal'
import { AdminTableSkeleton } from '../../../components/skeletons'
import styles from '../news/page.module.css'

interface MerchItem {
  id: number
  name: string
  description: string
  price: number
  image_url: string | null
  category: string
  in_stock: boolean
  stock_quantity: number | null
}

export default function AdminMerchPage() {
  const router = useRouter()
  const [merch, setMerch] = useState<MerchItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMerch, setEditingMerch] = useState<MerchItem | null>(null)

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchMerch()
  }, [router])

  const fetchMerch = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/merch`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setMerch(data)
    } catch (error) {
      console.error('Error fetching merch:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить этот товар?')) return

    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/merch/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to delete')
      
      await fetchMerch()
    } catch (error) {
      console.error('Error deleting merch:', error)
      alert('Ошибка при удалении')
    }
  }

  const handleEdit = (item: MerchItem) => {
    setEditingMerch(item)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingMerch(null)
  }

  const handleSave = () => {
    fetchMerch()
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>🛍️ Управление магазином</h1>
          <div style={{ width: '120px' }} />
        </header>
        <AdminTableSkeleton rows={5} />
      </div>
    )
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <button onClick={() => router.push('/admin')} className={styles.backButton}>
          ← Назад
        </button>
        <h1>🛍️ Управление магазином</h1>
        <button onClick={() => setShowModal(true)} className={styles.addButton}>
          + Добавить
        </button>
      </header>

      <MerchModal
        isOpen={showModal}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingMerch={editingMerch}
      />

      <div className={styles.list}>
        {merch.length === 0 ? (
          <div className={styles.empty}>
            <p>Товаров пока нет</p>
            <button onClick={() => setShowModal(true)} className={styles.emptyButton}>
              Добавить первый товар
            </button>
          </div>
        ) : (
          merch.map((item) => (
            <div key={item.id} className={styles.card}>
              <div className={styles.cardHeader}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  {item.image_url && (
                    <img 
                      src={item.image_url} 
                      alt={item.name}
                      style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }}
                    />
                  )}
                  <div>
                    <h3>{item.name}</h3>
                    <p style={{ color: '#888', margin: '0.25rem 0', fontSize: '0.9rem' }}>
                      {item.description}
                    </p>
                    <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.9rem' }}>
                      <span style={{ color: '#4CAF50', fontWeight: 600 }}>
                        {item.price} ₽
                      </span>
                      <span style={{ color: '#888' }}>
                        {item.category}
                      </span>
                      {item.stock_quantity !== null && (
                        <span style={{ color: '#888' }}>
                          На складе: {item.stock_quantity}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className={styles.cardActions}>
                  <span className={item.in_stock ? styles.published : styles.draft}>
                    {item.in_stock ? 'В наличии' : 'Нет в наличии'}
                  </span>
                  <button
                    onClick={() => handleEdit(item)}
                    className={styles.editButton}
                    title="Редактировать"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className={styles.deleteButton}
                    title="Удалить"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
