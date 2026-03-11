'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { uploadImage } from '../../lib/imageUpload'
import { FormValidator, rules, useFormValidation } from '../../lib/validation'
import { FormField } from '../ui/FormError'
import styles from './NewsModal.module.css'

interface NewsFormData {
  title: string
  content: string
  image_url: string
  published: boolean
  tags: string[]
}

interface News {
  id: number
  title: string
  content: string
  image_url: string | null
  published: boolean
  tags: string[]
  created_at: string
}

interface NewsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  editingNews: News | null
}

export function NewsModal({ isOpen, onClose, onSave, editingNews }: NewsModalProps) {
  const [formData, setFormData] = useState<NewsFormData>({
    title: '',
    content: '',
    image_url: '',
    published: true,
    tags: [],
  })
  const [uploading, setUploading] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const { errors, validateForm, clearErrors } = useFormValidation()

  const newsValidator = new FormValidator()
    .field('title', rules.required('Заголовок обязателен'), rules.minLength(3, 'Минимум 3 символа'), rules.maxLength(200, 'Максимум 200 символов'))
    .field('content', rules.required('Содержание обязательно'), rules.minLength(10, 'Минимум 10 символов'), rules.maxLength(5000, 'Максимум 5000 символов'))

  useEffect(() => {
    if (editingNews) {
      setFormData({
        title: editingNews.title,
        content: editingNews.content,
        image_url: editingNews.image_url || '',
        published: editingNews.published,
        tags: editingNews.tags || [],
      })
    } else {
      setFormData({
        title: '',
        content: '',
        image_url: '',
        published: true,
        tags: [],
      })
    }
    clearErrors()
  }, [editingNews, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm(newsValidator, formData)) {
      return
    }
    
    try {
      const token = localStorage.getItem('admin_token')
      const url = editingNews
        ? `${process.env.NEXT_PUBLIC_API_URL}/api/admin/news/${editingNews.id}`
        : `${process.env.NEXT_PUBLIC_API_URL}/api/admin/news`
      
      const method = editingNews ? 'PUT' : 'POST'
      
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
      console.error('Error saving news:', error)
      alert('Ошибка при сохранении новости')
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

  const handleAddTag = () => {
    const tag = tagInput.trim()
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] })
      setTagInput('')
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tagToRemove) })
  }

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAddTag()
    }
  }

  if (!isOpen) return null

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>{editingNews ? 'Редактировать новость' : 'Создать новость'}</h2>
          <button onClick={onClose} className={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <FormField label="Заголовок" error={errors.title} required htmlFor="title">
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Заголовок новости"
              maxLength={200}
            />
          </FormField>

          <FormField label="Содержание" error={errors.content} required htmlFor="content">
            <textarea
              id="content"
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Текст новости..."
              rows={10}
              maxLength={5000}
            />
          </FormField>

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
            <label>Теги</label>
            <div className={styles.tagInputContainer}>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                placeholder="Введите тег и нажмите Enter"
                maxLength={30}
              />
              <button type="button" onClick={handleAddTag} className={styles.addTagButton}>
                + Добавить
              </button>
            </div>
            
            {formData.tags.length > 0 && (
              <div className={styles.tagsList}>
                {formData.tags.map((tag) => (
                  <span key={tag} className={styles.tag}>
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className={styles.removeTagButton}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formGroup}>
            <label className={styles.checkbox}>
              <input
                type="checkbox"
                checked={formData.published}
                onChange={(e) => setFormData({ ...formData, published: e.target.checked })}
              />
              <span>Опубликовать сразу</span>
            </label>
          </div>

          <div className={styles.actions}>
            <button type="button" onClick={onClose} className={styles.cancelButton}>
              Отмена
            </button>
            <button type="submit" className={styles.submitButton}>
              {editingNews ? 'Сохранить изменения' : 'Создать новость'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
