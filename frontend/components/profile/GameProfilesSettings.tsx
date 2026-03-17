'use client'

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react'
import axios from 'axios'
import { Check, Gamepad2, Link2, Loader2, Swords, Unlink, WifiOff } from 'lucide-react'
import styles from './GameProfilesSettings.module.css'

interface GameProfileValue {
  game: string
  value: string
  displayValue: string
  linkedAt?: string | null
}

interface GameProfilesResponse {
  dota2: GameProfileValue | null
  cs2: GameProfileValue | null
  valorant: GameProfileValue | null
}

interface Props {
  apiUrl: string
  token: string | null
  enabled: boolean
  onProfilesChange?: (profiles: GameProfilesResponse) => void
}

type GameKey = 'dota2' | 'cs2' | 'valorant'

interface FieldState {
  value: string
  saving: boolean
  status: 'idle' | 'success' | 'error'
  message: string | null
}

const GAME_META: Record<GameKey, { title: string; hint: string; placeholder: string; icon: ReactNode }> = {
  dota2: {
    title: 'Dota 2',
    hint: 'Steam ID64 или ссылка на Steam-профиль',
    placeholder: '7656119... или https://steamcommunity.com/profiles/...',
    icon: <Swords size={16} />,
  },
  cs2: {
    title: 'CS2',
    hint: 'Steam ID64 или ссылка на Steam-профиль',
    placeholder: '7656119... или https://steamcommunity.com/id/...',
    icon: <Gamepad2 size={16} />,
  },
  valorant: {
    title: 'Valorant',
    hint: 'Riot ID в формате nickname#tag',
    placeholder: 'TenZ#NA1',
    icon: <Link2 size={16} />,
  },
}

const INITIAL_FIELDS: Record<GameKey, FieldState> = {
  dota2: { value: '', saving: false, status: 'idle', message: null },
  cs2: { value: '', saving: false, status: 'idle', message: null },
  valorant: { value: '', saving: false, status: 'idle', message: null },
}

const EMPTY_PROFILES: GameProfilesResponse = { dota2: null, cs2: null, valorant: null }
const STEAM_INPUT_RE = /^(?:\d{17}|https?:\/\/(?:www\.)?steamcommunity\.com\/(?:profiles\/\d{17}|id\/[A-Za-z0-9_-]{2,64})\/?)$/i
const VALORANT_INPUT_RE = /^[^#\s]{2,24}#[^#\s]{2,10}$/

export function GameProfilesSettings({ apiUrl, token, enabled, onProfilesChange }: Props) {
  const [loading, setLoading] = useState(false)
  const [fields, setFields] = useState<Record<GameKey, FieldState>>(INITIAL_FIELDS)
  const [profiles, setProfiles] = useState<GameProfilesResponse>(EMPTY_PROFILES)
  const onProfilesChangeRef = useRef<Props['onProfilesChange']>(onProfilesChange)

  useEffect(() => {
    onProfilesChangeRef.current = onProfilesChange
  }, [onProfilesChange])

  useEffect(() => {
    if (!enabled || !token) return

    let cancelled = false

    const run = async () => {
      setLoading(true)
      try {
        const { data } = await axios.get<GameProfilesResponse>(`${apiUrl}/api/profile/game-profiles`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (cancelled) return

        setProfiles(data)
        setFields({
          dota2: { value: data.dota2?.displayValue ?? '', saving: false, status: 'idle', message: null },
          cs2: { value: data.cs2?.displayValue ?? '', saving: false, status: 'idle', message: null },
          valorant: { value: data.valorant?.displayValue ?? '', saving: false, status: 'idle', message: null },
        })
        onProfilesChangeRef.current?.(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [apiUrl, enabled, token])

  const validators = useMemo(
    () => ({
      dota2: (value: string) => value.trim() === '' || STEAM_INPUT_RE.test(value.trim()),
      cs2: (value: string) => value.trim() === '' || STEAM_INPUT_RE.test(value.trim()),
      valorant: (value: string) => value.trim() === '' || VALORANT_INPUT_RE.test(value.trim()),
    }),
    [],
  )

  function updateField(game: GameKey, patch: Partial<FieldState>) {
    setFields((prev) => ({
      ...prev,
      [game]: {
        ...prev[game],
        ...patch,
      },
    }))
  }

  async function persist(game: GameKey, rawValue: string) {
    if (!token) return

    updateField(game, { saving: true, status: 'idle', message: null })

    try {
      const payload = { [game]: rawValue.trim() || '' }
      const { data } = await axios.patch<GameProfilesResponse>(`${apiUrl}/api/profile/game-profiles`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      })

      setProfiles(data)
      setFields((prev) => ({
        ...prev,
        [game]: {
          value: data[game]?.displayValue ?? '',
          saving: false,
          status: 'success',
          message: rawValue.trim() ? 'Сохранено' : 'Отвязано',
        },
      }))
      onProfilesChangeRef.current?.(data)
    } catch (error: any) {
      updateField(game, {
        saving: false,
        status: 'error',
        message: error?.response?.data?.detail || 'Не удалось сохранить привязку',
      })
    }
  }

  if (!enabled) {
    return null
  }

  return (
    <section className={styles.section}>
      <div className={styles.header}>
        <div>
          <h3>Игровые профили</h3>
          <p>Привяжите игровые аккаунты, чтобы показывать их в профиле и использовать в статистике.</p>
        </div>
        {loading && <Loader2 size={16} className={styles.spinner} />}
      </div>

      <div className={styles.grid}>
        {(['dota2', 'cs2', 'valorant'] as GameKey[]).map((game) => {
          const field = fields[game]
          const meta = GAME_META[game]
          const linkedProfile = profiles[game]
          const valueChanged = field.value.trim() !== (linkedProfile?.displayValue ?? '').trim()
          const valid = validators[game](field.value)
          const canSave = !field.saving && valid && valueChanged
          const canUnlink = !field.saving && Boolean(linkedProfile)

          return (
            <article key={game} className={styles.card}>
              <div className={styles.cardHeader}>
                <span className={styles.icon}>{meta.icon}</span>
                <div className={styles.cardTitleWrap}>
                  <strong>{meta.title}</strong>
                  <span>{meta.hint}</span>
                </div>
              </div>

              <input
                className={`${styles.input} ${field.status === 'error' ? styles.inputError : ''}`}
                value={field.value}
                onChange={(event) => updateField(game, { value: event.target.value, status: 'idle', message: null })}
                placeholder={meta.placeholder}
                autoComplete="off"
              />

              <div className={styles.metaRow}>
                <span className={styles.linkedValue}>
                  {linkedProfile ? `Сейчас: ${linkedProfile.displayValue}` : 'Пока не привязан'}
                </span>
                {!valid && (
                  <span className={styles.validationError}>
                    {game === 'valorant'
                      ? 'Нужен Riot ID вида nickname#tag'
                      : 'Нужен Steam ID64 или steamcommunity URL'}
                  </span>
                )}
              </div>

              <div className={styles.actions}>
                <button
                  type="button"
                  className={styles.saveBtn}
                  onClick={() => void persist(game, field.value)}
                  disabled={!canSave}
                >
                  {field.saving ? <Loader2 size={14} className={styles.spinner} /> : <Check size={14} />}
                  Сохранить
                </button>
                <button
                  type="button"
                  className={styles.unlinkBtn}
                  onClick={() => void persist(game, '')}
                  disabled={!canUnlink}
                >
                  <Unlink size={14} />
                  Отвязать
                </button>
              </div>

              {field.message && (
                <div className={field.status === 'error' ? styles.errorState : styles.successState}>
                  {field.status === 'error' ? <WifiOff size={14} /> : <Check size={14} />}
                  <span>{field.message}</span>
                </div>
              )}
            </article>
          )
        })}
      </div>
    </section>
  )
}
