'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo/Logo';
import LoginModal from '@/components/LoginModal/LoginModal';
import styles from './Header.module.css';

const NAV_ITEMS = [
  { label: 'Наша команда', href: '/#team' },
  { label: 'Стримы',       href: '/#streams' },
  { label: 'О нас',        href: '/#about' },
  { label: 'Соц. сети',   href: '/#social' },
  { label: 'Магазин',      href: '/#shop' },
];

export default function Header() {
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <>
      <motion.header
        className={styles.header}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Link href="/" className={styles.logoWrapper} aria-label="На главную">
          <Logo className={styles.logoImg} />
        </Link>

        <nav className={styles.nav} aria-label="Основная навигация">
          {NAV_ITEMS.map((item) => (
            <Link key={item.href} href={item.href} className={styles.navItem}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className={styles.buttons}>
          <Link href="/register" className={styles.btnRegister}>Регистрация</Link>
          <button
            className={styles.btnLogin}
            onClick={() => setLoginOpen(true)}
            type="button"
          >
            Войти
          </button>
        </div>
      </motion.header>

      <LoginModal
        isOpen={loginOpen}
        onClose={() => setLoginOpen(false)}
      />
    </>
  );
}
