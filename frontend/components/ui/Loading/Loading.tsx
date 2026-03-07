'use client'

import { motion } from 'framer-motion'
import { TreePine } from 'lucide-react'
import styles from './Loading.module.css'

interface LoadingProps {
  size?: 'small' | 'medium' | 'large'
  text?: string
}

export function Loading({ size = 'medium', text }: LoadingProps) {
  return (
    <div className={`${styles.loading} ${styles[size]}`}>
      <motion.div
        animate={{ 
          rotate: 360,
          scale: [1, 1.1, 1],
        }}
        transition={{ 
          rotate: {
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          },
          scale: {
            duration: 1,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
      >
        <div className={styles.icon}>
          <TreePine />
        </div>
      </motion.div>
      
      {text && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <p className={styles.text}>{text}</p>
        </motion.div>
      )}
    </div>
  )
}
