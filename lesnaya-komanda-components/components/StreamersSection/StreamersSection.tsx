'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import styles from './StreamersSection.module.css';
import type { Streamer } from '@/types';

// Asset URLs from Figma — TODO: download & place in /public/images/streamers/
const PLACEHOLDER_IMG = 'https://www.figma.com/api/mcp/asset/c28cdebf-e396-4128-837b-f5a160f4c84d';

// Placeholder streamers — replace with API data from your FastAPI backend
const STREAMERS: Streamer[] = Array.from({ length: 6 }, (_, i) => ({
  id: i + 1,
  name: '~△b9lBoJl.HoCuT.DEMIX~',
  description: 'Играет в различные компьютерные игры, вайбкодит, а так же не пьет уже много месяцев',
  imageUrl: PLACEHOLDER_IMG,
  twitchUrl: 'https://twitch.tv',
}));

const cardVariants = {
  hidden:  { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, delay: i * 0.07, ease: 'easeOut' },
  }),
};

interface StreamersSectionProps {
  streamers?: Streamer[];
}

export default function StreamersSection({ streamers = STREAMERS }: StreamersSectionProps) {
  return (
    <section className={styles.section}>
      <motion.div
        className={styles.sectionHeader}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.sectionTitle}>Стримеры</h2>
        <p className={styles.sectionSubtitle}>Наблюдайте за игроками лесной команды</p>
      </motion.div>

      <div className={styles.grid}>
        {streamers.map((streamer, i) => (
          <motion.a
            key={streamer.id}
            href={streamer.twitchUrl ?? '#'}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.card}
            variants={cardVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            custom={i}
          >
            <div className={styles.cardImage}>
              <img
                src={streamer.imageUrl}
                alt={streamer.name}
                className={styles.cardImg}
              />
            </div>
            <div className={styles.cardBody}>
              <h3 className={styles.cardName}>{streamer.name}</h3>
              <p className={styles.cardDescription}>{streamer.description}</p>
            </div>
          </motion.a>
        ))}
      </div>

      <Link href="/streamers" className={styles.showAllBtn}>
        Смотреть полностью
      </Link>
    </section>
  );
}
