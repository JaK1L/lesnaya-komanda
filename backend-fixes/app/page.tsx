import type { Metadata } from 'next';
import Header from '@/components/Header/Header';
import HeroSection from '@/components/HeroSection/HeroSection';
import NewsSection from '@/components/NewsSection/NewsSection';
import StreamersSection from '@/components/StreamersSection/StreamersSection';

export const metadata: Metadata = {
  title: 'Лесная Команда — Игровое сообщество стримеров',
  description:
    'Смотри стримы, следи за новостями и будь частью леса.',
  openGraph: {
    title: 'Лесная Команда',
    description: 'Смотри стримы, следи за новостями и будь частью леса.',
    url: 'https://lesnaya-komanda.vercel.app',
    siteName: 'Лесная Команда',
    locale: 'ru_RU',
    type: 'website',
  },
};

// ─── Серверный fetch — безопаснее, нет CORS, кэшируется ──────────
// Запросы делаются с сервера Vercel → Render, браузер вообще не знает

async function getStreamers() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/streamers`,
      {
        next: { revalidate: 300 },   // ISR: обновлять раз в 5 минут
      }
    );
    if (!res.ok) return undefined;
    return res.json();
  } catch {
    return undefined;               // Показываем placeholder при ошибке
  }
}

async function getNews() {
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/news`,
      {
        next: { revalidate: 60 },    // ISR: обновлять раз в минуту
      }
    );
    if (!res.ok) return undefined;
    return res.json();
  } catch {
    return undefined;
  }
}

export default async function HomePage() {
  // Параллельные запросы — быстрее чем последовательные
  const [streamers, news] = await Promise.all([
    getStreamers(),
    getNews(),
  ]);

  return (
    <>
      <Header />
      <main id="main-content">
        <HeroSection />
        <NewsSection articles={news} />
        <StreamersSection streamers={streamers} />
      </main>
    </>
  );
}
