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
      {
        name: 'Twitch',
        href: 'https://twitch.tv/lesnayakomanda',
        icon: (props: React.SVGProps<SVGSVGElement>) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714z" />
          </svg>
        ),
      },
      {
        name: 'Discord',
        href: 'https://discord.gg/YgX4RQZ',
        icon: (props: React.SVGProps<SVGSVGElement>) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.036c-.21.369-.444.85-.608 1.23a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.23.077.077 0 0 0-.079-.036 19.736 19.736 0 0 0-4.885 1.515.069.069 0 0 0-.032.027C.533 9.045-.319 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.007-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.372.292a.077.077 0 0 1-.006.128 12.28 12.28 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.77 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.684-3.549-13.66a.061.061 0 0 0-.031-.03z" />
          </svg>
        ),
      },
      {
        name: 'YouTube',
        href: 'https://youtube.com/c/lesnayakomanda',
        icon: (props: React.SVGProps<SVGSVGElement>) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
          </svg>
        ),
      },
      {
        name: 'Telegram',
        href: 'https://t.me/lesnayakomanda',
        icon: (props: React.SVGProps<SVGSVGElement>) => (
          <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
            <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.914.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
          </svg>
        ),
      },
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

            {/* Социальные сети — иконки */}
            <div className="mt-6">
              <h4 className="text-white font-medium text-sm mb-3">Мы в соцсетях</h4>
              <div className="flex flex-wrap gap-4">
                {contactInfo.socials.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#96a7d4] hover:text-white transition-colors duration-200"
                    aria-label={item.name}
                  >
                    <item.icon className="w-5 h-5" />
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
