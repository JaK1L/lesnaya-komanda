'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './HeroSection.module.css';

// Asset URLs from Figma — TODO: download & place in /public/icons/
const ASSETS = {
  arrowRight: 'https://www.figma.com/api/mcp/asset/4d6f3530-1955-497e-8068-ff8632fec33e',
  twitch:     'https://www.figma.com/api/mcp/asset/1dc93f51-af37-42d1-ab54-e2df9124c2ee',
  telegram:   'https://www.figma.com/api/mcp/asset/ad06ec98-bcfa-4036-b1f9-9b6b9d0b1bef',
  tiktok:     'https://www.figma.com/api/mcp/asset/aa007cc3-50dd-4954-8aa9-988f9297c08e',
  youtube:    'https://www.figma.com/api/mcp/asset/4eceaf65-ca20-4782-a45f-add01c3cfe05',
  light:      'https://www.figma.com/api/mcp/asset/183cad31-5177-45ee-b98e-1fbc10de7524',
};

const SOCIAL_LINKS = [
  { icon: ASSETS.twitch,   alt: 'Twitch',   href: 'https://twitch.tv' },
  { icon: ASSETS.telegram, alt: 'Telegram', href: 'https://t.me' },
  { icon: ASSETS.tiktok,   alt: 'TikTok',   href: 'https://tiktok.com' },
  { icon: ASSETS.youtube,  alt: 'YouTube',  href: 'https://youtube.com' },
];

const fadeUp = {
  hidden:  { opacity: 0, y: 24 },
  visible: (delay: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, delay, ease: 'easeOut' },
  }),
};

export default function HeroSection() {
  return (
    <section className={styles.hero}>
      {/* Tagline */}
      <motion.div
        className={styles.taglineContainer}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0}
      >
        <h1 className={styles.tagline}>
          Мы прокладываем миллион и тысячу новых путей
        </h1>
        <p className={styles.subTagline}>
          Смотри стримы, следи за новостями и будь частью леса.
          Всё в одном месте — без лишних кликов.
        </p>
      </motion.div>

      {/* CTA + Social */}
      <motion.div
        className={styles.actionsContainer}
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        custom={0.15}
      >
        <Link href="/register" className={styles.btnJoin}>
          Вступить в лес
          <img
            src={ASSETS.arrowRight}
            alt=""
            className={styles.arrowIcon}
            aria-hidden="true"
          />
        </Link>

        <div className={styles.socialButtons}>
          {SOCIAL_LINKS.map((s) => (
            <a
              key={s.alt}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.socialBtn}
              aria-label={s.alt}
            >
              <img src={s.icon} alt={s.alt} className={styles.socialIcon} />
            </a>
          ))}
        </div>
      </motion.div>

      {/* Ambient glow */}
      <div className={styles.glow} aria-hidden="true">
        <div className={styles.glowInner}>
          <img src={ASSETS.light} alt="" style={{ display: 'block', width: '100%', height: '100%' }} />
        </div>
      </div>
    </section>
  );
}
