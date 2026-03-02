'use client'

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'
import { GamePreference, VALID_GAMES } from '../types/gamePreferences'

interface GamePreferencesModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  onSkip: () => void
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export function GamePreferencesModal({ isOpen, onClose, onSave, onSkip }: GamePreferencesModalProps) {
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set())
  const [customGameName, setCustomGameName] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGameToggle = (game: string) => {
    const newSelected = new Set(selectedGames)
    if (newSelected.has(game)) {
      newSelected.delete(game)
      if (game === 'Другое') {
        setCustomGameName('')
      }
    } else {
      newSelected.add(game)
    }
    setSelectedGames(newSelected)
  }

  const handleSave = async () => {
    try {
      setIsSubmitting(true)
      setError(null)

      // Build preferences array
      const preferences: GamePreference[] = Array.from(selectedGames).map(game => ({
        game,
        custom_name: game === 'Другое' ? customGameName.trim() || null : null
      }))

      // Get token
      const token = localStorage.getItem('lesnaya_token')
      if (!token) {
        throw new Error('Not authenticated')
      }

      // Send to API
      await axios.post(
        `${API_URL}/api/users/game-preferences`,
        { preferences },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      onSave()
      onClose()
    } catch (err: any) {
      console.error('Error saving preferences:', err)
      setError(err.response?.data?.detail?.message || 'Не удалось сохранить предпочтения')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = async () => {
    try {
      setIsSubmitting(true)
      const token = localStorage.getItem('lesnaya_token')
      if (token) {
        await axios.post(
          `${API_URL}/api/users/game-preferences/skip`,
          {},
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )
      }
      onSkip()
      onClose()
    } catch (err) {
      console.error('Error skipping preferences:', err)
      onSkip()
      onClose()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="modal-overlay" onClick={onClose}>
        <motion.div
          className="modal-container"
          onClick={(e) => e.stopPropagation()}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
        >
          <h2 className="modal-title">Выберите игры, в которые вы играете</h2>
          <p className="modal-subtitle">Это поможет нам показывать актуальную статистику</p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <div className="games-grid">
            {VALID_GAMES.map((game) => (
              <label key={game} className="game-checkbox">
                <input
                  type="checkbox"
                  checked={selectedGames.has(game)}
                  onChange={() => handleGameToggle(game)}
                  disabled={isSubmitting}
                />
                <span className="checkbox-label">{game}</span>
              </label>
            ))}
          </div>

          <AnimatePresence>
            {selectedGames.has('Другое') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="custom-game-input"
              >
                <input
                  type="text"
                  value={customGameName}
                  onChange={(e) => setCustomGameName(e.target.value)}
                  placeholder="Введите название игры"
                  maxLength={50}
                  disabled={isSubmitting}
                  className="custom-input"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="modal-buttons">
            <button
              onClick={handleSave}
              disabled={selectedGames.size === 0 || isSubmitting}
              className="save-button"
            >
              {isSubmitting ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="skip-button"
            >
              Пропустить
            </button>
          </div>
        </motion.div>

        <style jsx>{`
          .modal-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.85);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            padding: 1rem;
          }

          .modal-container {
            background: var(--gray);
            border: 2px solid var(--accent);
            padding: 2rem;
            max-width: 600px;
            width: 100%;
            max-height: 90vh;
            overflow-y: auto;
          }

          .modal-title {
            font-family: 'Unbounded', sans-serif;
            font-size: 1.5rem;
            color: var(--accent);
            margin: 0 0 0.5rem 0;
          }

          .modal-subtitle {
            color: #888;
            margin: 0 0 2rem 0;
            font-size: 0.875rem;
          }

          .error-message {
            background: #ff4444;
            color: white;
            padding: 1rem;
            margin-bottom: 1rem;
            border: 2px solid #ff6b6b;
          }

          .games-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
            gap: 1rem;
            margin-bottom: 1.5rem;
          }

          .game-checkbox {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            padding: 0.75rem;
            background: var(--gray-light);
            border: 1px solid transparent;
            transition: all 0.2s;
          }

          .game-checkbox:hover {
            border-color: var(--accent);
          }

          .game-checkbox input[type="checkbox"] {
            width: 20px;
            height: 20px;
            cursor: pointer;
            accent-color: var(--accent);
          }

          .checkbox-label {
            font-size: 0.875rem;
            color: white;
          }

          .custom-game-input {
            margin-bottom: 1.5rem;
            overflow: hidden;
          }

          .custom-input {
            width: 100%;
            padding: 0.75rem;
            background: var(--gray-light);
            border: 2px solid var(--gray-light);
            color: white;
            font-size: 1rem;
            outline: none;
          }

          .custom-input:focus {
            border-color: var(--accent);
          }

          .modal-buttons {
            display: flex;
            gap: 1rem;
          }

          .save-button,
          .skip-button {
            flex: 1;
            padding: 1rem;
            font-family: 'Unbounded', sans-serif;
            font-size: 0.875rem;
            font-weight: 700;
            text-transform: uppercase;
            cursor: pointer;
            transition: all 0.2s;
            border: 2px solid;
          }

          .save-button {
            background: var(--accent);
            color: var(--background);
            border-color: var(--accent);
          }

          .save-button:hover:not(:disabled) {
            background: transparent;
            color: var(--accent);
          }

          .save-button:disabled {
            opacity: 0.5;
            cursor: not-allowed;
          }

          .skip-button {
            background: transparent;
            color: #888;
            border-color: #888;
          }

          .skip-button:hover:not(:disabled) {
            color: white;
            border-color: white;
          }

          @media (max-width: 768px) {
            .modal-container {
              padding: 1.5rem;
            }

            .games-grid {
              grid-template-columns: 1fr;
            }

            .modal-buttons {
              flex-direction: column;
            }
          }
        `}</style>
      </div>
    </AnimatePresence>
  )
}
