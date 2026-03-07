'use client'

import styles from './SkipToContent.module.css'

export function SkipToContent() {
  const handleSkip = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    const mainContent = document.getElementById('main-content')
    if (mainContent) {
      mainContent.focus()
      mainContent.scrollIntoView()
    }
  }

  return (
    <a 
      href="#main-content" 
      className={styles.skipLink}
      onClick={handleSkip}
    >
      Перейти к основному содержимому
    </a>
  )
}
