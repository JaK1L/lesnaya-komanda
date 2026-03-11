'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { uploadImage } from '../../lib/imageUpload'
import { FormValidator, rules, useFormValidation } from '../../lib/validation'
import { FormField } from '../ui/FormError'
import styles from './NewsModal.module.css'

interface MerchFormData {
  name: string
  description: string
  price: number
  image_url: string
  category: string
  in_stock: boolean
  stock_quantity: number
}

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

interface MerchModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingMerch: MerchItem | null
}

export function MerchModal({ isOpen, onClose, onSave, editingMerch }: MerchModalProps) {
  const [formData, setFormData] = useState<MerchFormData>({
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category: 'Одежда',
    in_stock: true,
    stock_quantity: 0,
  })
  const [uploading, setUploading] = useState(false)

  const { errors, validateForm, clearErrors } = useFormValidation()

  const merchValidator = new FormValidator()
    .field('name', rules.required('Название обязательно'), rules.maxLength(200, 'Максимум 200 символов'))
    .field('description', rules.required('Описание обязательно'), rules.maxLength(1000, 'Максимум 1000 символов'))
    .field('price', rules.required('Цена обязательна'))

  useEffect(() => {
    if (editingMerch) {
      setFormData({
        name: editingMerch.name,
        description: editingMerch.description,
        price: editingMerch.price,
        image_url: editingMerch.image_url || '',
        category: editingMerch.category,
        in_stock: editingMerch.in_stock,
        stock_quantity: editingMerch.stock_quantity || 0,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        price: 0,
        image_url: '',
        category: 'Одежда',
        in_stock: true,
        stock_quantity: 0,
      })
    }
    clearErrors()
  }, [editingMerch, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm(merchValidator, formData)) {
      return
    }
    
    try {
      const token = localStorage.getItem('admin_token')
      const url = editingMerch
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/merch/${editingMerch.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/merch`
      
      const method = editingMerch ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) throw new Error('Failed to save')
      
      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving merch:', error)
      alert('Ошибка при сохранении товара')
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const result = await uploadImage(file)
      if (result.success && result.url) {
        setFormData({ ...formData, image_url: result.url })
      } else {
        alert(result.error || 'Ошибка загрузки изображения')
      }
    } catch (error) {
      console.error('Upload error:', error)
      alert('Ошибка при загрузке изображения')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editingMerch ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <FormField label="Название" error={errors.name} required htmlFor="name">
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Футболка Лесная Команда"
              maxLength={200}
            />
          </FormField>

          <FormField label="Описание" error={errors.description} required htmlFor="description">
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Описание товара..."
              rows={4}
              maxLength={1000}
            />
          </FormField>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <FormField label="Цена (₽)" error={errors.price} required htmlFor="price">
              <input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                min={0}
                step={0.01}
              />
            </FormField>

            <div className={styles.formGroup}>
              <label htmlFor="stock_quantity">Количество на складе</label>
              <input
                id="stock_quantity"
                type="number"
                value={formData.stock_quantity}
                onChange={(e) => setFormData({ ...formData, stock_quantity: parseInt(e.target.value) || 0 })}
                min={0}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Категория</label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            >
              <option value="Одежда">Одежда</option>
              <option value="Аксессуары">Аксессуары</option>
              <option value="Стикеры">Стикеры</option>
              <option value="Другое">Другое</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label>Изображение</label>
            
            <div className={styles.imageUploadContainer}>
              <input
                type="file"
                id="image_file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploading}
                className={styles.fileInput}
              />
              <label htmlFor="image_file" className={styles.uploadButton}>
                {uploading ? 'Загрузка...' : '📁 Выбрать файл'}
              </label>
              
              <span className={styles.orText}>или</span>
              
              <input
                type="url"
                value={formData.image_url}
                onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                placeholder="Вставить URL изображения"
                maxLength={500}
                className={styles.urlInput}
              />
            </div>

            {formData.image_url && (
              <div className={styles.imagePreview}>
                <img src={formData.image_url} alt="Превью" onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }} />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, image_url: '' })}
                  className={styles.removeImageButton}
                >
                  ✕ Удалить
                </button>
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.in_stock}
                onChange={(e) => setFormData({ ...formData, in_stock: e.target.checked })}
              />
              <span>В наличии</span>
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              {editingMerch ? 'Сохранить изменения' : 'Добавить товар'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
