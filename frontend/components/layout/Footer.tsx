import { Icon } from '../ui/Icon'
import styles from './Footer.module.css'

export function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.content}>
        <div className={styles.socials}>
          <a 
            href="https://discord.com/invite/YgX4RQZ" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Discord"
            className={styles.socialLink}
          >
            <Icon name="discord" size="large" />
          </a>
          <a 
            href="https://t.me/lesnayakomanda" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Telegram"
            className={styles.socialLink}
          >
            <Icon name="telegram" size="large" />
          </a>
          <a 
            href="https://twitch.tv/lesnayakomanda" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="Twitch"
            className={styles.socialLink}
          >
            <Icon name="twitch" size="large" />
          </a>
          <a 
            href="https://youtube.com/@lesnayakomanda" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="YouTube"
            className={styles.socialLink}
          >
            <Icon name="youtube" size="large" />
          </a>
          <a 
            href="https://vk.com/lesnayakomanda" 
            target="_blank" 
            rel="noopener noreferrer"
            aria-label="VK"
            className={styles.socialLink}
          >
            <Icon name="vk" size="large" />
          </a>
        </div>
        
        <div className={styles.info}>
          <p>© 2026 ЛЕСНАЯ КОМАНДА. ВСЕ ПРАВА ЗАЩИЩЕНЫ.</p>
          <p>СДЕЛАНО С 🌲 В ЛЕСУ</p>
        </div>
      </div>
    </footer>
  )
}
