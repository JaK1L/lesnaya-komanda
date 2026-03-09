import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

interface FooterProps {
  logoText?: string;
  companyName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  logoText = 'LK',
  companyName = 'LesnayaKomanda',
}) => {
  const currentYear = new Date().getFullYear();

  const socials = [
    { name: 'Twitch', href: 'https://twitch.tv/lesnayakomanda' },
    { name: 'Discord', href: 'https://discord.gg/YgX4RQZ' },
    { name: 'YouTube', href: 'https://youtube.com/c/lesnayakomanda' },
    { name: 'Telegram', href: 'https://t.me/lesnayakomanda' },
  ];

  const legalLinks = [
    { name: 'Политика конфиденциальности', href: '/privacy' },
    { name: 'Пользовательское соглашение', href: '/terms' },
  ];

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.content}>
          {/* Левая колонка - О проекте */}
          <div className={styles.column}>
            <Link href="/" className={styles.logo}>
              <span className={styles.logoText}>{logoText}</span>
            </Link>
            <p className={styles.description}>
              Объединение стримеров и комьюнити. Смотри стримы, загружай клипы, общайся без границ.
            </p>
          </div>

          {/* Центральная колонка - Контакты */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Контакты</h3>
            <div className={styles.contactInfo}>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Email:</span>
                <span className={styles.contactValue}>ЛЕСНАЯ КОМАНДА ПОКА НЕ ИМЕЕТ ПОЧТЫ</span>
              </div>
              <div className={styles.contactItem}>
                <span className={styles.contactLabel}>Партнерство:</span>
                <span className={styles.contactValue}>ЛЕСНАЯ КОМАНДА ПОКА НЕ ИМЕЕТ ПОЧТЫ</span>
              </div>
            </div>
            <div className={styles.socialsSection}>
              <h4 className={styles.socialsTitle}>Мы в соцсетях</h4>
              <div className={styles.socials}>
                {socials.map((item) => (
                  <a
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.socialLink}
                  >
                    {item.name}
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* Правая колонка - Быстрые ссылки */}
          <div className={styles.column}>
            <h3 className={styles.columnTitle}>Быстрые ссылки</h3>
            <nav className={styles.quickLinks}>
              <Link href="/about" className={styles.quickLink}>О нас</Link>
              <Link href="/partners" className={styles.quickLink}>Партнёрам</Link>
              <Link href="/support" className={styles.quickLink}>Поддержка</Link>
              <Link href="/blog" className={styles.quickLink}>Блог</Link>
            </nav>
          </div>
        </div>

        {/* Нижняя часть - копирайт и юридические ссылки */}
        <div className={styles.bottom}>
          <div className={styles.bottomContent}>
            <p className={styles.copyright}>
              © {currentYear} {companyName}. Все права защищены.
            </p>
            <div className={styles.legalLinks}>
              {legalLinks.map((item) => (
                <Link key={item.name} href={item.href} className={styles.legalLink}>
                  {item.name}
                </Link>
              ))}
            </div>
            <p className={styles.madeWith}>
              Сделано с <span className={styles.heart}>❤️</span> для комьюнити
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
