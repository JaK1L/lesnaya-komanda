import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Админ-панель | Лесная Команда',
  description: 'Управление контентом сайта Лесная Команда',
  robots: {
    index: false,
    follow: false,
  },
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
