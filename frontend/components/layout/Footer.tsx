import React from 'react';
import Link from 'next/link';

// --- Типы для пропсов (если нужно будет передавать данные извне) ---
interface FooterProps {
  logoText?: string;
  companyName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  logoText = 'STREAMTEAM',
  companyName = 'StreamTeam',
}) => {
  // Текущий год для копирайта
  const currentYear = new Date().getFullYear();

  // --- Данные для левой части (Навигация) ---
  const navigation = {
    main: [
      { name: 'Главная', href: '/' },
      { name: 'Стримеры', href: '/streamers' },
      { name: 'Новости', href: '/news' },
      { name: 'Клипы', href: '/clips' },
      { name: 'Расписание', href: '/schedule' },
    ],
    legal: [
      { name: 'Политика конфиденциальности', href: '/privacy' },
      { name: 'Пользовательское соглашение', href: '/terms' },
    ],
  };

  // --- Данные для центральной части (Контакты + соцсети) ---
  const contactInfo = {
    email: 'ЛЕСНАЯ КОМАНДА ПОКА НЕ ИМЕЕТ ПОЧТЫ',
    partnership: 'ЛЕСНАЯ КОМАНДА ПОКА НЕ ИМЕЕТ ПОЧТЫ',
    socials: [
      { name: 'Twitch', href: 'https://twitch.tv/lesnayakomanda' },
      { name: 'Discord', href: 'https://discord.gg/YgX4RQZ' },
      { name: 'YouTube', href: 'https://youtube.com/c/lesnayakomanda' },
      { name: 'Telegram', href: 'https://t.me/lesnayakomanda' },
    ],
  };

  // --- Данные для правой части (Быстрые ссылки / SEO) ---
  const quickLinks = [
    { name: 'О нас', href: '/about' },
    { name: 'Партнёрам', href: '/partners' },
    { name: 'Вакансии', href: '/careers' },
    { name: 'Поддержка', href: '/support' },
    { name: 'Блог', href: '/blog' },
  ];

  return (
    <footer className="bg-[#0b0e14] border-t border-[#1f2840]">
      {/* Основная часть футера с тремя колонками */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-12 md:gap-8">
          {/* Колонка 1: Логотип + краткое описание + навигация (основная) */}
          <div className="md:col-span-4">
            <Link href="/" className="inline-block mb-4">
              <span className="text-2xl font-bold bg-gradient-to-r from-[#a0b5ff] to-white bg-clip-text text-transparent">
                {logoText}
              </span>
            </Link>
            <p className="text-[#96a7d4] text-sm leading-relaxed mb-6 max-w-sm">
              Объединение стримеров и комьюнити. Смотри стримы, загружай клипы, общайся без границ.
            </p>
            <nav className="flex flex-wrap gap-x-6 gap-y-3">
              {navigation.main.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-sm text-[#b0bcdd] hover:text-white transition-colors duration-200"
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Колонка 2: Контакты + Социальные сети */}
          <div className="md:col-span-4">
            <h3 className="text-white font-semibold text-lg mb-4">Контакты</h3>
            <ul className="space-y-3 text-sm text-[#b0bcdd]">
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#5865f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${contactInfo.email}`} className="hover:text-white transition">
                  {contactInfo.email}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-[#5865f2]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <a href={`mailto:${contactInfo.partnership}`} className="hover:text-white transition">
                  {contactInfo.partnership}
                </a>
              </li>
            </ul>

            {/* Социальные сети — текстовые ссылки */}
            <div className="mt-6">
              <h4 className="text-white font-medium text-sm mb-3">Мы в соцсетях</h4>
              <div className="flex flex-wrap gap-x-4 gap-y-2">
                {contactInfo.socials.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[#b0bcdd] hover:text-white transition-colors duration-200"
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Колонка 3: Быстрые ссылки + юридическая информация */}
          <div className="md:col-span-4">
            <h3 className="text-white font-semibold text-lg mb-4">Быстрые ссылки</h3>
            <nav className="grid grid-cols-2 gap-2">
              {quickLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-[#b0bcdd] hover:text-white transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </nav>

            {/* Юридические ссылки */}
            <div className="mt-6 pt-6 border-t border-[#1f2840]">
              <nav className="flex flex-wrap gap-x-4 gap-y-2">
                {navigation.legal.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-xs text-[#6f7da0] hover:text-[#b0bcdd] transition"
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>
          </div>
        </div>
      </div>

      {/* Нижняя полоса с копирайтом */}
      <div className="border-t border-[#1f2840] py-5">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row justify-between items-center text-xs text-[#6f7da0]">
          <p>© {currentYear} {companyName}. Все права защищены.</p>
          <p className="mt-2 sm:mt-0">
            Сделано с <span className="text-[#e9313f]">❤️</span> для комьюнити
          </p>
        </div>
      </div>
    </footer>
  );
};
