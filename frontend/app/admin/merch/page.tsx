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
  in_stock: boolean
  display_order: number
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export default function AdminMerchPage() {
  const [items, setItems] = useState<MerchItem[]>([])
  const [loading, setLoading] = useState(true)
  const [editingItem, setEditingItem] = useState<MerchItem | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    fetchMerch()
  }, [])

  const fetchMerch = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('admin_token')
      const response = await axios.get<MerchItem[]>(`${API_URL}/api/admin/merch`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      setItems(response.data)
    } catch (err) {
      console.error('Error fetching merch:', err)
      alert('Ошибка загрузки товаров')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setIsCreating(true)
    setEditingItem({
      id: 0,
      name: '',
      description: '',
      price: 0,
      image_url: '',
      category: '',
      sizes: '',
      in_stock: true,
      display_order: items.length
    })
  }

  const handleEdit = (item: MerchItem) => {
    setIsCreating(false)
    setEditingItem({ ...item })
  }

  const handleSave = async () => {
    if (!editingItem) return

    try {
      const token = localStorage.getItem('admin_token')
      
      if (isCreating) {
        const { id, ...itemData } = editingItem
        await axios.post(
          `${API_URL}/api/admin/merch`,
          itemData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      } else {
        const { id, ...itemData } = editingItem
        await axios.put(
          `${API_URL}/api/admin/merch/${editingItem.id}`,
          itemData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
      }
      
      setEditingItem(null)
      setIsCreating(false)
      fetchMerch()
      alert('Сохранено!')
    } catch (err) {
      console.error('Error saving item:', err)
      alert('Ошибка сохранения')
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить товар?')) return

    try {
      const token = localStorage.getItem('admin_token')
      await axios.delete(`${API_URL}/api/admin/merch/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      fetchMerch()
      alert('Удалено')
    } catch (err) {
      console.error('Error deleting item:', err)
      alert('Ошибка удаления')
    }
  }

  if (loading) {
    return <div className={styles.container}>Загрузка...</div>
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Управление магазином</h1>
        <button onClick={handleCreate} className={styles.btnCreate}>
          + Добавить товар
        </button>
      </div>

      {editingItem && (
        <div className={styles.editForm}>
          <h2>{isCreating ? 'Новый товар' : 'Редактирование товара'}</h2>
          
          <div className={styles.formRow}>
            <label>Название *</label>
            <input
              type="text"
              value={editingItem.name}
              onChange={(e) => setEditingItem({...editingItem, name: e.target.value})}
              placeholder="Футболка Лесная Команда"
            />
          </div>

          <div className={styles.formRow}>
            <label>Описание</label>
            <textarea
              value={editingItem.description || ''}
              onChange={(e) => setEditingItem({...editingItem, description: e.target.value})}
              placeholder="Описание товара..."
              rows={4}
            />
          </div>

          <div className={styles.formRow}>
            <label>Цена (₽) *</label>
            <input
              type="number"
              value={editingItem.price}
              onChange={(e) => setEditingItem({...editingItem, price: parseFloat(e.target.value) || 0})}
              min="0"
              step="0.01"
            />
          </div>

          <div className={styles.formRow}>
            <label>URL изображения</label>
            <input
              type="text"
              value={editingItem.image_url || ''}
              onChange={(e) => setEditingItem({...editingItem, image_url: e.target.value})}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div className={styles.formRow}>
            <label>Категория</label>
            <input
              type="text"
              value={editingItem.category || ''}
              onChange={(e) => setEditingItem({...editingItem, category: e.target.value})}
              placeholder="Одежда, Аксессуары и т.д."
            />
          </div>

          <div className={styles.formRow}>
            <label>Размеры</label>
            <input
              type="text"
              value={editingItem.sizes || ''}
              onChange={(e) => setEditingItem({...editingItem, sizes: e.target.value})}
              placeholder="S, M, L, XL"
            />
          </div>

          <div className={styles.formRow}>
            <label>Порядок отображения</label>
            <input
              type="number"
              value={editingItem.display_order}
              onChange={(e) => setEditingItem({...editingItem, display_order: parseInt(e.target.value) || 0})}
              min="0"
            />
          </div>

          <div className={styles.formRow}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={editingItem.in_stock}
                onChange={(e) => setEditingItem({...editingItem, in_stock: e.target.checked})}
              />
              <span>В наличии</span>
            </label>
          </div>

          <div className={styles.formActions}>
            <button onClick={handleSave} className={styles.btnSave}>
              Сохранить
            </button>
            <button onClick={() => { setEditingItem(null); setIsCreating(false); }} className={styles.btnCancel}>
              Отмена
            </button>
          </div>
        </div>
      )}

      <div className={styles.itemsList}>
        <h2>Товары ({items.length})</h2>
        
        {items.length === 0 ? (
          <p className={styles.empty}>Товаров пока нет. Добавьте первый товар.</p>
        ) : (
          <div className={styles.items}>
            {items.map((item) => (
              <div key={item.id} className={styles.itemCard}>
                <div className={styles.itemImage}>
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} />
                  ) : (
                    <div className={styles.imagePlaceholder}>🛍️</div>
                  )}
                </div>
                
                <div className={styles.itemInfo}>
                  <h3>{item.name}</h3>
                  <p className={styles.itemPrice}>{item.price} ₽</p>
                  {item.description && (
                    <p className={styles.itemDescription}>{item.description}</p>
                  )}
                  <div className={styles.itemMeta}>
                    {item.category && <span className={styles.badge}>{item.category}</span>}
                    {item.sizes && <span className={styles.badge}>Размеры: {item.sizes}</span>}
                    <span className={item.in_stock ? styles.badgeSuccess : styles.badgeError}>
                      {item.in_stock ? 'В наличии' : 'Нет в наличии'}
                    </span>
                    <span className={styles.badge}>Порядок: {item.display_order}</span>
                  </div>
                </div>

                <div className={styles.itemActions}>
                  <button onClick={() => handleEdit(item)} className={styles.btnEdit}>
                    Редактировать
                  </button>
                  <button onClick={() => handleDelete(item.id)} className={styles.btnDelete}>
                    Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
