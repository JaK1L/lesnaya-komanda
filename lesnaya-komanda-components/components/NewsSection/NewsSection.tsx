'use client';

import { useRef } from 'react';
import { motion } from 'framer-motion';
import styles from './NewsSection.module.css';
import type { NewsArticle, Tag } from '@/types';

// Asset URLs from Figma — TODO: download & place in /public/images/news/
const ASSETS = {
  arrowNext: 'https://www.figma.com/api/mcp/asset/d70deaca-4977-4e80-8740-e85dbef1a51c',
  arrowPrev: 'https://www.figma.com/api/mcp/asset/6d02fdc6-8d2b-4aa2-a3d7-95b48750b246',
  img1:      'https://www.figma.com/api/mcp/asset/c6beb423-d05b-4469-aec9-c6b9b711d966',
  img2:      'https://www.figma.com/api/mcp/asset/e48ca39c-cb74-4e99-bc74-82517f4f94a7',
  img3:      'https://www.figma.com/api/mcp/asset/92111c5b-689d-427a-a464-ee9595be7a04',
  img4:      'https://www.figma.com/api/mcp/asset/2bb41de0-ccb0-4152-9a27-a83264b20b22',
};

// Placeholder articles — replace with API data from your FastAPI backend
const ARTICLES: NewsArticle[] = [
  {
    id: 1,
    title: 'Этот парень, шокировал всю лесную команду',
    body: 'Осознав масштаб событий, паренек из лесной команды, не стал дробить и собрал самые сильные предметы в игре',
    imageUrl: ASSETS.img1,
    tags: [
      { label: 'Легендарный момент', variant: 'default' },
      { label: 'Dota',               variant: 'red' },
    ],
  },
  {
    id: 2,
    title: 'Этот парень, шокировал всю лесную команду',
    body: 'Осознав масштаб событий, паренек из лесной команды, не стал дробить и собрал самые сильные предметы в игре',
    imageUrl: ASSETS.img2,
    tags: [
      { label: 'Клип со стрима', variant: 'default' },
      { label: 'Dota',           variant: 'red' },
      { label: 'Twitch',         variant: 'purple' },
    ],
  },
  {
    id: 3,
    title: 'Этот парень, шокировал всю лесную команду',
    body: 'Осознав масштаб событий, паренек из лесной команды, не стал дробить и собрал самые сильные предметы в игре',
    imageUrl: ASSETS.img3,
    tags: [
      { label: 'Клип со стрима', variant: 'default' },
      { label: 'CS 2',           variant: 'violet' },
      { label: 'Twitch',         variant: 'purple' },
    ],
  },
  {
    id: 4,
    title: 'Этот парень, шокировал всю лесную команду',
    body: 'Осознав масштаб событий, паренек из лесной команды, не стал дробить и собрал самые сильные предметы в игре',
    imageUrl: ASSETS.img4,
    tags: [
      { label: 'Легендарный момент', variant: 'default' },
    ],
  },
];

const TAG_CLASS: Record<Tag['variant'], string> = {
  default: styles.tagDefault,
  red:     styles.tagRed,
  purple:  styles.tagPurple,
  violet:  styles.tagViolet,
};

const SCROLL_STEP = 450;

interface NewsSectionProps {
  articles?: NewsArticle[];
}

export default function NewsSection({ articles = ARTICLES }: NewsSectionProps) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: 'prev' | 'next') => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({
      left: dir === 'next' ? SCROLL_STEP : -SCROLL_STEP,
      behavior: 'smooth',
    });
  };

  return (
    <section className={styles.section}>
      <motion.div
        className={styles.sectionHeader}
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <h2 className={styles.sectionTitle}>Новости</h2>
        <p className={styles.sectionSubtitle}>Отборные новости для наших последователей</p>
      </motion.div>

      <div className={styles.scrollWrapper}>
        <div className={styles.scrollTrack} ref={trackRef}>
          {articles.map((article, i) => (
            <motion.article
              key={article.id}
              className={styles.card}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
            >
              <div className={styles.cardImage}>
                <img
                  src={article.imageUrl}
                  alt={article.title}
                  className={styles.cardImg}
                />
              </div>

              <div className={styles.cardBody}>
                <h3 className={styles.cardTitle}>{article.title}</h3>
                <p className={styles.cardText}>{article.body}</p>
              </div>

              <div className={styles.tags}>
                {article.tags.map((tag) => (
                  <span
                    key={tag.label}
                    className={`${styles.tag} ${TAG_CLASS[tag.variant]}`}
                  >
                    {tag.label}
                  </span>
                ))}
              </div>
            </motion.article>
          ))}
        </div>

        <div className={styles.fadeRight} aria-hidden="true" />

        <button
          className={`${styles.navBtn} ${styles.navBtnPrev}`}
          onClick={() => scroll('prev')}
          aria-label="Предыдущие новости"
        >
          <img src={ASSETS.arrowPrev} alt="" className={styles.navIcon} />
        </button>

        <button
          className={`${styles.navBtn} ${styles.navBtnNext}`}
          onClick={() => scroll('next')}
          aria-label="Следующие новости"
        >
          <img src={ASSETS.arrowNext} alt="" className={styles.navIcon} />
        </button>
      </div>
    </section>
  );
}
