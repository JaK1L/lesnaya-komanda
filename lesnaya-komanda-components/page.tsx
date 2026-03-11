import Header from '@/components/Header/Header';
import HeroSection from '@/components/HeroSection/HeroSection';
import NewsSection from '@/components/NewsSection/NewsSection';
import StreamersSection from '@/components/StreamersSection/StreamersSection';

export default function HomePage() {
  return (
    <>
      <Header />
      <main>
        <HeroSection />
        <NewsSection />
        <StreamersSection />
      </main>
    </>
  );
}
