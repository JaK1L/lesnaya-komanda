import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { GoogleAnalytics } from '../components/GoogleAnalytics'
import { YandexMetrika } from '../components/YandexMetrika'
import './globals.css'

const inter = Inter({ subsets: ['latin', 'cyrillic'] })

export const metadata: Metadata = {
  metadataBase: new URL('https://lesnaya-komanda.com'),
  title: {
    default: 'Лесная Команда - Игровое сообщество',
    template: '%s | Лесная Команда'
  },
  description: 'Мы — своя стая. Игровое сообщество для CS2, Dota 2, Valorant и других игр. Присоединяйся к лесной команде!',
  keywords: [
    'игровое сообщество',
    'CS2',
    'Dota 2',
    'Valorant',
    'киберспорт',
    'стримеры',
    'Discord',
    'Telegram',
    'лесная команда',
    'gaming community'
  ],
  authors: [{ name: 'Лесная Команда' }],
  creator: 'Лесная Команда',
  publisher: 'Лесная Команда',
  
  // Open Graph
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    url: 'https://lesnaya-komanda.com',
    siteName: 'Лесная Команда',
    title: 'Лесная Команда - Игровое сообщество',
    description: 'Мы — своя стая. Игровое сообщество для CS2, Dota 2, Valorant и других игр.',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Лесная Команда',
      }
    ],
  },
  
  // Twitter
  twitter: {
    card: 'summary_large_image',
    title: 'Лесная Команда - Игровое сообщество',
    description: 'Мы — своя стая. Игровое сообщество для CS2, Dota 2, Valorant и других игр.',
    images: ['/twitter-image.jpg'],
    creator: '@lesnaya_komanda',
  },
  
  // Icons
  icons: {
    icon: '/favicon.svg',
    apple: '/favicon.svg',
  },
  
  // Manifest
  manifest: '/site.webmanifest',
  
  // Robots
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  
  // Verification
  verification: {
    // google: 'your-google-verification-code',
    // yandex: 'your-yandex-verification-code',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <head>
        {/* Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Organization',
              name: 'Лесная Команда',
              url: 'https://lesnaya-komanda.com',
              logo: 'https://lesnaya-komanda.com/logo.png',
              description: 'Игровое сообщество для CS2, Dota 2, Valorant и других игр',
              sameAs: [
                'https://discord.gg/lesnaya',
                'https://t.me/lesnaya_komanda',
              ],
              contactPoint: {
                '@type': 'ContactPoint',
                contactType: 'Customer Service',
                availableLanguage: ['Russian'],
              },
            }),
          }}
        />
      </head>
      <body className={inter.className}>
        <GoogleAnalytics />
        <YandexMetrika />
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
      </body>
    </html>
  )
}