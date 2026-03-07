/**
 * Утилита для загрузки изображений на ImgBB
 * Бесплатный API для хостинга изображений
 */

const IMGBB_API_KEY = '8d32e7f8c8e9c8f8c8e9c8f8c8e9c8f8' // Замени на свой ключ с https://api.imgbb.com/

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

export async function uploadImage(file: File): Promise<UploadResult> {
  try {
    // Проверка размера файла (максимум 32MB для ImgBB)
    if (file.size > 32 * 1024 * 1024) {
      return {
        success: false,
        error: 'Файл слишком большой. Максимум 32MB',
      }
    }

    // Проверка типа файла
    if (!file.type.startsWith('image/')) {
      return {
        success: false,
        error: 'Можно загружать только изображения',
      }
    }

    // Конвертируем файл в base64
    const base64 = await fileToBase64(file)

    // Создаем FormData для отправки
    const formData = new FormData()
    formData.append('key', IMGBB_API_KEY)
    formData.append('image', base64.split(',')[1]) // Убираем префикс data:image/...

    // Отправляем на ImgBB
    const response = await fetch('https://api.imgbb.com/1/upload', {
      method: 'POST',
      body: formData,
    })

    const data = await response.json()

    if (data.success) {
      return {
        success: true,
        url: data.data.url,
      }
    } else {
      return {
        success: false,
        error: data.error?.message || 'Ошибка загрузки',
      }
    }
  } catch (error) {
    console.error('Upload error:', error)
    return {
      success: false,
      error: 'Ошибка при загрузке изображения',
    }
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}
