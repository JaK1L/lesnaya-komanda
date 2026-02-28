import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Админка — Лесная Команда',
  description: 'Админ-панель сообщества Лесная Команда',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <div className="min-h-screen bg-black text-white">
          <header className="border-b border-[var(--gray-light)]">
            <div className="container flex items-center justify-between py-4">
              <a href="/" className="nav-logo">
                <span>ЛЕСНАЯ КОМАНДА</span>
              </a>
              <span className="text-xs uppercase tracking-[0.2em] text-gray-400">
                Админ-панель
              </span>
            </div>
          </header>
          <main className="container py-10">{children}</main>
        </div>
      </body>
    </html>
  )
}

