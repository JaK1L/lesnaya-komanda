import { AlertCircle } from 'lucide-react'
import styles from './FormError.module.css'

interface FormErrorProps {
  error?: string | null | undefined
  className?: string
}

export function FormError({ error, className = '' }: FormErrorProps) {
  if (!error) return null

  return (
    <div className={`${styles.error} ${className}`} role="alert">
      <AlertCircle size={16} className={styles.icon} />
      <span className={styles.message}>{error}</span>
    </div>
  )
}

interface FormFieldProps {
  label: string
  error?: string | null | undefined
  required?: boolean
  children: React.ReactNode
  htmlFor?: string
}

export function FormField({ label, error, required, children, htmlFor }: FormFieldProps) {
  return (
    <div className={styles.field}>
      <label htmlFor={htmlFor} className={styles.label}>
        {label}
        {required && <span className={styles.required}>*</span>}
      </label>
      {children}
      <FormError error={error} />
    </div>
  )
}
