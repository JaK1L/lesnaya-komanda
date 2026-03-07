import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Стримеры',
  description: 'Смотрите стримы участников Лесной Команды. Лучшие игроки в CS2, Dota 2, Valorant и других играх.',
  keywords: ['стримеры', 'twitch', 'youtube', 'CS2', 'Dota 2', 'Valorant'],
  openGraph: {
    title: 'Стримеры | Лесная Команда',
    description: 'Смотрите стримы участников Лесной Команды',
  },
}

export default function StreamsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
