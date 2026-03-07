import { TreePine, Home, Search } from 'lucide-react'
import { Button } from '../components/ui/Button/Button'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.notFound}>
      <div className={styles.content}>
        <div className={styles.icon}>
          <TreePine size={80} />
        </div>
        
        <h1 className={styles.title}>404</h1>
        
        <h2 className={styles.subtitle}>Страница не найдена</h2>
        
        <p className={styles.message}>
          Похоже, вы заблудились в лесу. Эта страница не существует или была перемещена.
        </p>

        <div className={styles.actions}>
          <Button href="/" variant="primary" size="large">
            <Home size={20} />
            На главную
          </Button>
          
          <Button href="/profile" variant="secondary" size="large">
            <Search size={20} />
            Профиль
          </Button>
        </div>

        <div className={styles.forest}>
          <span className={styles.tree}>🌲</span>
          <span className={styles.tree}>🌲</span>
          <span className={styles.tree}>🌲</span>
          <span className={styles.tree}>🌲</span>
          <span className={styles.tree}>🌲</span>
        </div>
      </div>
    </div>
  )
}
