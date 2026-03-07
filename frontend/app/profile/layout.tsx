import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Мой профиль',
  description: 'Управление профилем в Лесной Команде. Редактируйте информацию о себе, выбирайте игры и настраивайте приватность.',
  openGraph: {
    title: 'Мой профиль | Лесная Команда',
    description: 'Управление профилем в Лесной Команде',
  },
}

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
