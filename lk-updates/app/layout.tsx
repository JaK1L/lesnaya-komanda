import type { Metadata } from 'next';
import { Manrope } from 'next/font/google';
import Footer from '@/components/Footer/Footer';
import './globals.css';

const manrope = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600'],
  variable: '--font-manrope',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL('https://lesnaya-komanda.vercel.app'),
  title: {
    default: 'Лесная Команда — Игровое сообщество',
    template: '%s — Лесная Команда',
  },
  description: 'Смотри стримы, следи за новостями и будь частью леса.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru" className={manrope.variable}>
      <body>
        {children}
        <Footer />
      </body>
    </html>
  );
}
