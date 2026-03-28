'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Bell, Menu, X } from 'lucide-react'
import axios from 'axios'
import { LoginModal } from '../auth/LoginModal'
import Logo from '../Logo/Logo'
import { getImageUrl } from '../../lib/imageUtils'
import { getProfileIdentifierFromToken } from '../../lib/profileIdentifier'
import styles from './Navigation.module.css'

interface NavigationProps {
  isAuthenticated: boolean
  onLogout: () => void
  apiUrl: string
}

interface NotificationItem {
  id: number
  kind: string
  title: string
  body: string | null
  link: string | null
  is_read: boolean
  created_at: string
  actor_name: string | null
  actor_avatar_url: string | null
  actor_user_id?: number | null
  friend_request_id?: number | null
  actions_available?: boolean
  metadata?: Record<string, unknown>
}

const NAV_ITEMS = [
  { label: 'Наша команда', href: '/team' },
  { label: 'Стримы', href: '#streams' },
  { label: 'Турниры', href: '/tournaments' },
  { label: 'Медиа', href: '/media' },
  { label: 'О нас', href: '/about' },
  { label: 'Соц. сети', href: '/social' },
  { label: 'Мерч', href: '/merch' },
]

export function Navigation({ isAuthenticated, onLogout }: NavigationProps) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [loginModalOpen, setLoginModalOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [friendRequestActionId, setFriendRequestActionId] = useState<number | null>(null)
  const navRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const router = useRouter()

  const loadNotifications = async () => {
    const token = localStorage.getItem('lesnaya_token')
    if (!token) return

    try {
      const [listRes, countRes] = await Promise.all([
        axios.get<NotificationItem[]>(`${API_URL}/api/notifications`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get<{ count: number }>(`${API_URL}/api/notifications/unread-count`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      setNotifications(listRes.data)
      setUnreadCount(countRes.data.count || 0)
    } catch {
      setNotifications([])
      setUnreadCount(0)
    }
  }

  const markAllNotificationsRead = async () => {
    const token = localStorage.getItem('lesnaya_token')
    if (!token) return
    try {
      await axios.post(`${API_URL}/api/notifications/read-all`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      })
      await loadNotifications()
    } catch {}
  }

  const handleNotificationClick = async (item: NotificationItem) => {
    if (item.kind === 'friend_request' && item.friend_request_id) {
      setNotificationsOpen(false)
      if (item.link) {
        router.push(item.link)
      }
      return
    }

    const token = localStorage.getItem('lesnaya_token')
    if (token && !item.is_read) {
      try {
        await axios.post(`${API_URL}/api/notifications/${item.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        })
        setNotifications((prev) => prev.map((entry) => entry.id === item.id ? { ...entry, is_read: true } : entry))
        setUnreadCount((prev) => Math.max(0, prev - 1))
      } catch {}
    }

    setNotificationsOpen(false)
    if (item.link) {
      router.push(item.link)
    }
  }

  const handleFriendRequestAction = async (item: NotificationItem, action: 'accept' | 'decline') => {
    const token = localStorage.getItem('lesnaya_token')
    if (!token || !item.friend_request_id) return

    setFriendRequestActionId(item.friend_request_id)
    try {
      await axios.post(
        `${API_URL}/api/friends/${action}/${item.friend_request_id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } },
      )
      await loadNotifications()
    } catch {
      // ignore, dropdown remains open with the same notification
    } finally {
      setFriendRequestActionId(null)
    }
  }

  const handleProfileClick = () => {
    const token = localStorage.getItem('lesnaya_token')
    const profileIdentifier = getProfileIdentifierFromToken(token)

    if (profileIdentifier) {
      router.push(`/profile/${encodeURIComponent(profileIdentifier)}`)
      return
    }

    router.push('/profile')
  }

  const closeMobileMenu = () => setMobileMenuOpen(false)

  const renderNotificationItem = (item: NotificationItem, options?: { closeMenu?: boolean }) => (
    <div
      key={`${item.kind}-${item.id}`}
      role="button"
      tabIndex={0}
      className={`${styles.notificationItem} ${!item.is_read ? styles.notificationItemUnread : ''}`}
      onClick={() => {
        if (options?.closeMenu) closeMobileMenu()
        void handleNotificationClick(item)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault()
          if (options?.closeMenu) closeMobileMenu()
          void handleNotificationClick(item)
        }
      }}
    >
      <div className={styles.notificationAvatar}>
        {item.actor_avatar_url ? (
          <img src={getImageUrl(item.actor_avatar_url) || ''} alt={item.actor_name || item.title} />
        ) : (
          <Bell size={14} />
        )}
      </div>
      <div className={styles.notificationContent}>
        <strong>{item.title}</strong>
        {item.body && <span>{item.body}</span>}
        {item.actions_available && item.friend_request_id && (
          <div className={styles.notificationActions} onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className={styles.notificationAccept}
              onClick={() => void handleFriendRequestAction(item, 'accept')}
              disabled={friendRequestActionId === item.friend_request_id}
            >
              Принять
            </button>
            <button
              type="button"
              className={styles.notificationDecline}
              onClick={() => void handleFriendRequestAction(item, 'decline')}
              disabled={friendRequestActionId === item.friend_request_id}
            >
              Отклонить
            </button>
          </div>
        )}
      </div>
    </div>
  )

  const handleStreamsClick = (e: React.MouseEvent) => {
    e.preventDefault()
    closeMobileMenu()
    if (pathname === '/') {
      document.getElementById('streams')?.scrollIntoView({ behavior: 'smooth' })
    } else {
      router.push('/streams')
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      void loadNotifications()
    } else {
      setNotifications([])
      setUnreadCount(0)
    }
  }, [isAuthenticated, pathname])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (loginModalOpen) setLoginModalOpen(false)
        if (mobileMenuOpen) closeMobileMenu()
        if (notificationsOpen) setNotificationsOpen(false)
      }
    }

    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [mobileMenuOpen, loginModalOpen, notificationsOpen])

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileMenuOpen])

  useEffect(() => {
    const handlePointerOutside = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeMobileMenu()
        setNotificationsOpen(false)
      }
    }

    document.addEventListener('pointerdown', handlePointerOutside)
    return () => document.removeEventListener('pointerdown', handlePointerOutside)
  }, [])

  return (
    <>
      <div className={styles.navWrapper} ref={navRef}>
        <nav className={styles.nav}>
          <div className={styles.container}>
            <Link href="/" className={styles.logo}>
              <Logo />
            </Link>

            <div className={styles.navLinks}>
              {NAV_ITEMS.map((item) =>
                item.label === 'Стримы' ? (
                  <a key="streams" href="#" className={styles.link} onClick={handleStreamsClick}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={item.href} href={item.href} className={styles.link} onClick={closeMobileMenu}>
                    {item.label}
                  </Link>
                ),
              )}
            </div>

            <div className={styles.headerBtns}>
              {isAuthenticated ? (
                <>
                  <div className={styles.notificationWrap}>
                    <button
                      type="button"
                      className={`${styles.notificationBtn} ${unreadCount > 0 ? styles.notificationBtnActive : ''}`}
                      onClick={() => setNotificationsOpen((prev) => !prev)}
                      aria-label="Уведомления"
                    >
                      <Bell size={18} />
                      {unreadCount > 0 && <span className={styles.notificationDot} />}
                    </button>
                    {notificationsOpen && (
                      <div className={styles.notificationPanel}>
                        <div className={styles.notificationHeader}>
                          <strong>Уведомления</strong>
                          {unreadCount > 0 && (
                            <button type="button" className={styles.notificationAction} onClick={() => void markAllNotificationsRead()}>
                              Прочитать все
                            </button>
                          )}
                        </div>
                        <div className={styles.notificationList}>
                          {notifications.length === 0 ? (
                            <div className={styles.notificationEmpty}>Пока ничего нет.</div>
                          ) : (
                            notifications.map((item) => renderNotificationItem(item))
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  <button onClick={() => void handleProfileClick()} className={`${styles.btn} ${styles.linkButton}`}>
                    Профиль
                  </button>
                  <button onClick={onLogout} className={`${styles.btn} ${styles.loginButton}`}>
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" className={`${styles.btn} ${styles.linkButton}`}>
                    Регистрация
                  </Link>
                  <button onClick={() => setLoginModalOpen(true)} className={`${styles.btn} ${styles.loginButton}`}>
                    Войти
                  </button>
                </>
              )}
            </div>

            <button
              className={styles.mobileMenuButton}
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {mobileMenuOpen && (
          <div className={styles.mobileMenu}>
            <div className={styles.mobileNavLinks}>
              {NAV_ITEMS.map((item) =>
                item.label === 'Стримы' ? (
                  <a key="mobile-streams" href="#" className={styles.mobileLink} onClick={handleStreamsClick}>
                    {item.label}
                  </a>
                ) : (
                  <Link key={`mobile-${item.href}`} href={item.href} className={styles.mobileLink} onClick={closeMobileMenu}>
                    {item.label}
                  </Link>
                ),
              )}
            </div>

            <div className={styles.mobileAuth}>
              {isAuthenticated ? (
                <>
                  <button
                    onClick={() => {
                      void markAllNotificationsRead()
                    }}
                    className={`${styles.btn} ${styles.notificationMobileBtn} ${unreadCount > 0 ? styles.notificationBtnActive : ''}`}
                  >
                    <Bell size={18} />
                    {unreadCount > 0 ? `Уведомления (${unreadCount})` : 'Уведомления'}
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu()
                      void handleProfileClick()
                    }}
                    className={`${styles.btn} ${styles.linkButton}`}
                  >
                    Профиль
                  </button>
                  <button
                    onClick={() => {
                      closeMobileMenu()
                      onLogout()
                    }}
                    className={`${styles.btn} ${styles.loginButton}`}
                  >
                    Выйти
                  </button>
                </>
              ) : (
                <>
                  <Link href="/register" className={`${styles.btn} ${styles.linkButton}`} onClick={closeMobileMenu}>
                    Регистрация
                  </Link>
                  <button
                    onClick={() => {
                      closeMobileMenu()
                      setLoginModalOpen(true)
                    }}
                    className={`${styles.btn} ${styles.loginButton}`}
                  >
                    Войти
                  </button>
                </>
              )}
            </div>
            {isAuthenticated && notifications.length > 0 && (
              <div className={styles.mobileNotificationList}>
                {notifications.slice(0, 4).map((item) => renderNotificationItem(item, { closeMenu: true }))}
              </div>
            )}
          </div>
        )}
      </div>

      <LoginModal
        isOpen={loginModalOpen}
        onClose={() => setLoginModalOpen(false)}
        onSuccess={() => {
          setLoginModalOpen(false)
          window.location.reload()
        }}
      />
    </>
  )
}
