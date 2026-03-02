'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import '../globals.css'
import './mobile-admin.css'

const links = [
  { href: '/admin', label: 'Обзор' },
  { href: '/admin/events', label: 'События' },
  { href: '/admin/news', label: 'Новости' },
  { href: '/admin/feed', label: 'Лента' },
  { href: '/admin/settings', label: 'Настройки' },
]

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  return (
    <html lang="ru">
      <body className="bg-black text-white">
        <div className="min-h-screen">
          <header className="border-b border-[var(--gray-light)]">
            <div className="container flex items-center justify-between py-4">
              <a href="/" className="nav-logo">
                <span>ЛЕСНАЯ КОМАНДА</span>
              </a>
              <nav className="admin-nav">
                {links.map((link) => {
                  const active =
                    pathname === link.href || pathname?.startsWith(link.href + '/')
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={`admin-nav-link${
                        active ? ' admin-nav-link--active' : ''
                      }`}
                    >
                      {link.label}
                    </Link>
                  )
                })}
              </nav>
            </div>
          </header>
          <main className="container py-10">{children}</main>
        </div>
      </body>
    </html>
  )
}

