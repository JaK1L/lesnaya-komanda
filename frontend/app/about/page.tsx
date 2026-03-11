'use client'

import styles from './page.module.css'

export default function AboutPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>О нас</h1>
        <p className={styles.subtitle}>Узнайте больше о Лесной Команде</p>
      </div>

      <div className={styles.content}>
        <p className={styles.placeholder}>Контент скоро появится</p>
      </div>
    </div>
  )
}
