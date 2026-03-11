'use client'

import styles from './page.module.css'

export default function PrivacyPage() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Политика конфиденциальности</h1>
      </div>

      <div className={styles.content}>
        <section className={styles.section}>
          <h2>1. Общие положения</h2>
          <p>
            Настоящая Политика конфиденциальности определяет порядок обработки и защиты 
            персональных данных пользователей сайта Лесная Команда.
          </p>
        </section>

        <section className={styles.section}>
          <h2>2. Собираемая информация</h2>
          <p>Мы можем собирать следующую информацию:</p>
          <ul>
            <li>Discord ID и имя пользователя</li>
            <li>Email адрес</li>
            <li>Аватар из Discord</li>
            <li>Игровая статистика и предпочтения</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>3. Использование информации</h2>
          <p>Собранная информация используется для:</p>
          <ul>
            <li>Предоставления доступа к функциям сайта</li>
            <li>Отображения профиля пользователя</li>
            <li>Улучшения качества сервиса</li>
            <li>Связи с пользователями</li>
          </ul>
        </section>

        <section className={styles.section}>
          <h2>4. Защита данных</h2>
          <p>
            Мы принимаем необходимые меры для защиты персональных данных от 
            несанкционированного доступа, изменения или уничтожения.
          </p>
        </section>

        <section className={styles.section}>
          <h2>5. Cookies</h2>
          <p>
            Сайт использует cookies для улучшения пользовательского опыта и 
            аналитики посещаемости.
          </p>
        </section>

        <section className={styles.section}>
          <h2>6. Контакты</h2>
          <p>
            По вопросам конфиденциальности обращайтесь в наш Discord сервер.
          </p>
        </section>
      </div>
    </div>
  )
}
