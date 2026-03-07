import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Магазин',
  description: 'Официальный мерч Лесной Команды. Худи, футболки, кружки и другие товары с символикой команды.',
  keywords: ['мерч', 'магазин', 'худи', 'футболки', 'товары'],
  openGraph: {
    title: 'Магазин | Лесная Команда',
    description: 'Официальный мерч Лесной Команды',
  },
}

export default function MerchLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
