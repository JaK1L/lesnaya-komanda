'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import styles from './AuthModal.module.css'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (token: string) => void
  apiUrl: string
  initialMode?: 'login' | 'register'
}

export function AuthModal({ 
  isOpen, 
  onClose, 
  onSuccess, 
  apiUrl,
  initialMode = 'login' 
}: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)

  // Сброс режима при открытии
  useEffect(() => {
    if (isOpen) {
      setMode(initialMode)
    }
  }, [isOpen, initialMode])

  // Блокировка скролла при открытой модалке
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  const handleSuccess = (token: string) => {
    onSuccess(token)
    onClose()
  }

  const handleDiscordLogin = () => {
    window.location.href = `${apiUrl}/api/auth/discord`
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className={styles.modalWrapper}>
          {/* Overlay */}
          <div onClick={onClose}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className={styles.overlay} />
            </motion.div>
          </div>

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
          >
            <div className={styles.modal}>
              <div className={styles.modalContent}>
                <button
                  onClick={onClose}
                  className={styles.closeButton}
                  aria-label="Закрыть"
                >
                <X size={24} />
              </button>

              <div className={styles.content}>
                {mode === 'login' ? (
                  <LoginForm
                    onSuccess={handleSuccess}
                    onSwitchToRegister={() => setMode('register')}
                    apiUrl={apiUrl}
                  />
                ) : (
                  <RegisterForm
                    onSuccess={handleSuccess}
                    onSwitchToLogin={() => setMode('login')}
                    apiUrl={apiUrl}
                  />
                )}

                <div className={styles.divider}>
                  <span>или войти с помощью</span>
                </div>

                <button
                  onClick={handleDiscordLogin}
                  className={styles.discordButton}
                >
                  Discord
                </button>
              </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
