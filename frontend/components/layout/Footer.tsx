import React from 'react';
import Link from 'next/link';
import styles from './Footer.module.css';

interface FooterProps {
  logoText?: string;
  companyName?: string;
}

export const Footer: React.FC<FooterProps> = ({
  logoText = 'LK',
  companyName = 'LesnayaKomanda',
}) => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <Link href="/" className={styles.logo}>
          <span className={styles.logoText}>{logoText}</span>
        </Link>
        <p className={styles.copyright}>
          © {currentYear} {companyName}
        </p>
      </div>
    </footer>
  );
};
