import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Команда',
  description: 'Познакомьтесь с участниками Лесной Команды. Элита леса, рейтинги игроков и статистика.',
  keywords: ['команда', 'игроки', 'рейтинг', 'статистика'],
  openGraph: {
    title: 'Команда | Лесная Команда',
    description: 'Познакомьтесь с участниками Лесной Команды',
  },
}

export default function SocialLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
