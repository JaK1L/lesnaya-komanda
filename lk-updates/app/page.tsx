import type { Metadata } from 'next';
import Header from '@/components/Header/Header';
import HeroSection from '@/components/HeroSection/HeroSection';
import NewsSection from '@/components/NewsSection/NewsSection';
import StreamersSection from '@/components/StreamersSection/StreamersSection';

// ─── SEO ───────────────────────────────────────────────────────
export const metadata: Metadata = {
  title: 'Лесная Команда — Игровое сообщество стримеров',
  description:
    'Смотри стримы, следи за новостями и будь частью леса. Лесная Команда — сообщество стримеров, играющих в Dota 2, CS2 и другие игры.',
  keywords: ['лесная команда', 'стримеры', 'twitch', 'dota', 'cs2', 'игровое сообщество'],
  openGraph: {
    title: 'Лесная Команда',
    description: 'Смотри стримы, следи за новостями и будь частью леса.',
    url: 'https://lesnaya-komanda.vercel.app',
    siteName: 'Лесная Команда',
    // TODO: добавь og:image — положи файл в /public/og-image.png (1200×630px)
    // images: [{ url: '/og-image.png', width: 1200, height: 630 }],
    locale: 'ru_RU',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Лесная Команда',
    description: 'Смотри стримы, следи за новостями и будь частью леса.',
  },
};

// ─── Data fetching ──────────────────────────────────────────────
// Раскомментируй когда подключишь FastAPI эндпоинты:
//
// async function getNews() {
//   try {
//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/news`, {
//       next: { revalidate: 60 }, // ISR — обновляем каждую минуту
//     });
//     if (!res.ok) return undefined;
//     return res.json();
//   } catch { return undefined; }
// }
//
// async function getStreamers() {
//   try {
//     const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/streamers`, {
//       next: { revalidate: 300 },
//     });
//     if (!res.ok) return undefined;
//     return res.json();
//   } catch { return undefined; }
// }

export default async function HomePage() {
  // const [news, streamers] = await Promise.all([getNews(), getStreamers()]);

  return (
    <>
      <Header />
      <main id="main-content">
        <HeroSection />
        <NewsSection   /* articles={news} */ />
        <StreamersSection /* streamers={streamers} */ />
      </main>
    </>
  );
}
