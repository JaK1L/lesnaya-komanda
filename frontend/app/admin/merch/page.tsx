'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { uploadImage } from '../../../lib/imageUpload'
import { AdminTableSkeleton } from '../../../components/skeletons'
import styles from '../news/page.module.css'

interface Merch {
  id: number
  name: string
  description: string | null
  price: number
  image_url: string | null
  category: string | null
  sizes: string | null
  in_stock: boolean
  display_order: number
}

export default function AdminMerchPage() {
  const router = useRouter()
  const [items, setItems] = useState<Merch[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState<Merch | null>(null)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category: 'футболки',
    sizes: 'S, M, L, XL',
    in_stock: true,
    display_order: 0,
  })

  useEffect(() => {
    const token = localStorage.getItem('admin_token')
    if (!token) {
      router.push('/admin')
      return
    }
    fetchItems()
  }, [router])

  const fetchItems = async () => {
    try {
      const token = localStorage.getItem('admin_token')
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/merch`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) throw new Error('Failed to fetch')
      
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('Error fetching merch:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setImageFile(null)
    setImagePreview('')
    setFormData({ ...formData, image_url: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      let imageUrl = formData.image_url

      // Загружаем изображение если выбрано
      if (imageFile) {
        setIsUploading(true)
        const result = await uploadImage(imageFile)
        if (result.success && result.url) {
          imageUrl = result.url
        } else {
          alert(result.error || 'Ошибка загрузки изображения')
          setIsUploading(false)
          return
        }
        setIsUploading(false)
      }

      const token = localStorage.getItem('admin_token')
      const url = editingItem
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/merch/${editingItem.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/merch`
      
      const method = editingItem ? 'PUT' : 'POST'
      
      const payload = {
        ...formData,
        image_url: imageUrl || null,
        description: formData.description || null,
        category: formData.category || null,
        sizes: formData.sizes || null,
      }
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      await fetchItems()
      handleCancelEdit()
    } catch (error) {
      console.error('Error saving merch:', error)
      alert('Ошибка при сохранении товара')
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
      
      await fetchItems()
    } catch (error) {
      console.error('Error deleting merch:', error)
      alert('Ошибка при удалении')
    }
  }

  const handleEdit = (item: Merch) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price,
      image_url: item.image_url || '',
      category: item.category || 'футболки',
      sizes: item.sizes || '',
      in_stock: item.in_stock,
      display_order: item.display_order,
    })
    setImagePreview(item.image_url || '')
    setShowForm(true)
  }

  const handleCancelEdit = () => {
    setEditingItem(null)
    setFormData({
      name: '',
      description: '',
      price: 0,
      image_url: '',
      category: 'футболки',
      sizes: 'S, M, L, XL',
      in_stock: true,
      display_order: 0,
    })
    setImageFile(null)
    setImagePreview('')
    setShowForm(false)
  }

  if (isLoading) {
    return (
      <div className={styles.container}>
        <header className={styles.header}>
          <button onClick={() => router.push('/admin')} className={styles.backButton}>
            ← Назад
          </button>
          <h1>🛍️ Управление магазином</h1>
          <div style={{ width: '120px' }} /> {/* Spacer */}
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
        <button onClick={() => {
          if (showForm && editingItem) {
            handleCancelEdit()
          } else {
            setShowForm(!showForm)
          }
        }} className={styles.addButton}>
          {showForm ? 'Отмена' : '+ Добавить'}
        </button>
      </header>

      {showForm && (
        <div className={styles.formContainer}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <h2 style={{ marginTop: 0, marginBottom: '1.5rem' }}>
              {editingItem ? 'Редактировать товар' : 'Добавить товар'}
            </h2>

            <div className={styles.formGroup}>
              <label htmlFor="name">Название товара</label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder='Футболка "Лесная"'
                required
                maxLength={200}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Описание</label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Описание товара..."
                rows={4}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="price">Цена (₽)</label>
              <input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                placeholder="1500"
                required
                min={0}
                step={0.01}
              />
            </div>

            <div className={styles.formGroup}>
              <label>Изображение товара</label>
              <div style={{ display: 'flex', gap: '1rem', flexDirection: 'column' }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                  id="image-upload"
                />
                <label htmlFor="image-upload" style={{ 
                  padding: '0.75rem 1rem',
                  background: '#7cb342',
                  color: 'white',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  textAlign: 'center',
                  display: 'inline-block',
                  width: 'fit-content'
                }}>
                  📁 Выбрать файл
                </label>
                
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => {
                    setFormData({ ...formData, image_url: e.target.value })
                    setImagePreview(e.target.value)
                  }}
                  placeholder="Или вставьте ссылку на изображение"
                  maxLength={500}
                />

                {imagePreview && (
                  <div style={{ position: 'relative', width: 'fit-content' }}>
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      style={{ 
                        maxWidth: '300px', 
                        maxHeight: '300px',
                        borderRadius: '8px',
                        objectFit: 'cover'
                      }} 
                    />
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.7)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        cursor: 'pointer',
                        fontSize: '18px'
                      }}
                    >
                      ×
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Категория</label>
              <select
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="футболки">Футболки</option>
                <option value="худи">Худи</option>
                <option value="аксессуары">Аксессуары</option>
                <option value="другое">Другое</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="sizes">Размеры</label>
              <input
                id="sizes"
                type="text"
                value={formData.sizes}
                onChange={(e) => setFormData({ ...formData, sizes: e.target.value })}
                placeholder="S, M, L, XL, XXL"
                maxLength={200}
              />
              <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                Укажите доступные размеры через запятую
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="display_order">Порядок отображения</label>
              <input
                id="display_order"
                type="number"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                min={0}
              />
              <small style={{ color: '#888', fontSize: '0.85rem', marginTop: '0.25rem', display: 'block' }}>
                Меньше число = выше в списке
              </small>
            </div>

            <div className={styles.formGroup}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={formData.in_stock}
                  onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
                />
                В наличии
              </label>
            </div>

            <button type="submit" className={styles.submitButton} disabled={isUploading}>
              {isUploading ? 'Загрузка изображения...' : editingItem ? 'Сохранить изменения' : 'Добавить товар'}
            </button>
          </form>
        </div>
      )}

      <div className={styles.list}>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <p>Товаров пока нет</p>
            <button onClick={() => setShowForm(true)} className={styles.emptyButton}>
              Добавить первый товар
            </button>
          </div>
        ) : (
          items.map((item) => (
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
                    <small style={{ color: '#7cb342', fontWeight: 'bold', fontSize: '1.1rem' }}>
                      {item.price.toFixed(2)} ₽
                    </small>
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
              <p className={styles.cardContent}>{item.description || 'Описание отсутствует'}</p>
              <div className={styles.cardFooter}>
                <span className={styles.date}>
                  📦 {item.category}
                </span>
                {item.sizes && (
                  <span className={styles.draft}>
                    📏 {item.sizes}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
