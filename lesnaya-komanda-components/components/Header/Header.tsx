'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { label: 'Наша команда', href: '#team' },
  { label: 'Стримы',       href: '#streams' },
  { label: 'О нас',        href: '#about' },
  { label: 'Соц. сети',    href: '#social' },
  { label: 'Магазин',      href: '#shop' },
];

// Replace with your Next.js <Image> asset once you download the logo
const LOGO_URL = 'https://www.figma.com/api/mcp/asset/88ae2a7c-81c5-4ef3-880e-44a1b3056b27';

export default function Header() {
  return (
    <motion.header
      className={styles.header}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Logo */}
      <Link href="/" className={styles.logoWrapper}>
        {/* TODO: Download logo and place in /public/images/logo.svg, then use:
            <Image src="/images/logo.svg" alt="L-Komand" width={130} height={28} priority /> */}
        <img src={LOGO_URL} alt="L-Komand" className={styles.logoImg} />
      </Link>

      {/* Navigation */}
      <nav className={styles.nav}>
        {NAV_ITEMS.map((item) => (
          <Link key={item.href} href={item.href} className={styles.navItem}>
            {item.label}
          </Link>
        ))}
      </nav>

      {/* Auth Buttons */}
      <div className={styles.buttons}>
        <Link href="/register" className={styles.btnRegister}>
          Регистрация
        </Link>
        <Link href="/login" className={styles.btnLogin}>
          Войти
        </Link>
      </div>
    </motion.header>
  );
}
