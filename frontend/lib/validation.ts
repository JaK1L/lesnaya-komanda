/**
 * Утилиты для валидации форм
 */

export interface ValidationRule {
  validate: (value: any) => boolean
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: Record<string, string>
}

// Базовые правила валидации
export const rules = {
  required: (message = 'Это поле обязательно'): ValidationRule => ({
    validate: (value: any) => {
      if (typeof value === 'string') return value.trim().length > 0
      if (typeof value === 'number') return !isNaN(value)
      if (Array.isArray(value)) return value.length > 0
      return value !== null && value !== undefined
    },
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.trim().length >= min,
    message: message || `Минимум ${min} символов`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    validate: (value: string) => value.trim().length <= max,
    message: message || `Максимум ${max} символов`,
  }),

  email: (message = 'Неверный формат email'): ValidationRule => ({
    validate: (value: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      return emailRegex.test(value.trim())
    },
    message,
  }),

  url: (message = 'Неверный формат URL'): ValidationRule => ({
    validate: (value: string) => {
      try {
        new URL(value.trim())
        return true
      } catch {
        return false
      }
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    validate: (value: number) => value >= min,
    message: message || `Минимальное значение: ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    validate: (value: number) => value <= max,
    message: message || `Максимальное значение: ${max}`,
  }),

  pattern: (regex: RegExp, message = 'Неверный формат'): ValidationRule => ({
    validate: (value: string) => regex.test(value),
    message,
  }),

  fileSize: (maxSizeMB: number, message?: string): ValidationRule => ({
    validate: (file: File) => {
      if (!file) return true // Если файл не выбран, пропускаем
      return file.size <= maxSizeMB * 1024 * 1024
    },
    message: message || `Максимальный размер файла: ${maxSizeMB}MB`,
  }),

  fileType: (allowedTypes: string[], message?: string): ValidationRule => ({
    validate: (file: File) => {
      if (!file) return true // Если файл не выбран, пропускаем
      return allowedTypes.some(type => file.type.startsWith(type))
    },
    message: message || `Разрешенные типы: ${allowedTypes.join(', ')}`,
  }),

  custom: (validator: (value: any) => boolean, message: string): ValidationRule => ({
    validate: validator,
    message,
  }),
}

// Валидатор формы
export class FormValidator {
  private rules: Record<string, ValidationRule[]> = {}

  field(name: string, ...validationRules: ValidationRule[]): FormValidator {
    this.rules[name] = validationRules
    return this
  }

  validate(data: Record<string, any>): ValidationResult {
    const errors: Record<string, string> = {}

    for (const [fieldName, fieldRules] of Object.entries(this.rules)) {
      const value = data[fieldName]

      for (const rule of fieldRules) {
        if (!rule.validate(value)) {
          errors[fieldName] = rule.message
          break // Показываем только первую ошибку для поля
        }
      }
    }

    return {
      isValid: Object.keys(errors).length === 0,
      errors,
    }
  }

  validateField(name: string, value: any): string | null {
    const fieldRules = this.rules[name]
    if (!fieldRules) return null

    for (const rule of fieldRules) {
      if (!rule.validate(value)) {
        return rule.message
      }
    }

    return null
  }
}

// Хук для использования валидации в компонентах
export function useFormValidation() {
  const [errors, setErrors] = React.useState<Record<string, string>>({})

  const validateField = (validator: FormValidator, name: string, value: any) => {
    const error = validator.validateField(name, value)
    setErrors(prev => ({
      ...prev,
      [name]: error || '',
    }))
    return error === null
  }

  const validateForm = (validator: FormValidator, data: Record<string, any>) => {
    const result = validator.validate(data)
    setErrors(result.errors)
    return result.isValid
  }

  const clearError = (name: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[name]
      return newErrors
    })
  }

  const clearErrors = () => {
    setErrors({})
  }

  return {
    errors,
    validateField,
    validateForm,
    clearError,
    clearErrors,
  }
}

// React import для хука
import React from 'react'
