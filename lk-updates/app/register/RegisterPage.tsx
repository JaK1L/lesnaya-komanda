'use client';

import Link from 'next/link';
import { useState } from 'react';
import { motion } from 'framer-motion';
import Logo from '@/components/Logo/Logo';
import styles from './RegisterPage.module.css';

export default function RegisterPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          email: form.email,
          password: form.password,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.detail ?? 'Ошибка регистрации');
      }

      // Redirect to login after success
      window.location.href = '/login';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* Left — hero artwork side */}
      <div className={styles.heroSide}>
        <div className={styles.heroContent}>
          <h1 className={styles.heroTagline}>
            Мы прокладываем миллион и тысячу новых путей
          </h1>
          <p className={styles.heroSub}>
            Присоединяйся к лесной команде — смотри стримы, следи за новостями и будь частью леса.
          </p>
        </div>
        <div className={styles.heroGlow} aria-hidden="true" />
      </div>

      {/* Right — form side */}
      <div className={styles.formSide}>
        <div className={styles.formContainer}>
          {/* Header */}
          <div className={styles.formHeader}>
            <h2 className={styles.formTitle}>Создать аккаунт</h2>
            <p className={styles.formSubtitle}>Уже есть аккаунт? <Link href="/login" className={styles.link}>Войти</Link></p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className={styles.form}>
            {/* Username */}
            <div className={styles.inputContainer}>
              <label className={styles.label} htmlFor="username">Имя пользователя</label>
              <input
                id="username"
                name="username"
                type="text"
                placeholder="Введите имя пользователя"
                value={form.username}
                onChange={handleChange}
                className={styles.input}
                autoComplete="username"
                required
              />
              <span className={styles.hint}>
                Только латинские буквы, цифры и символы _ -
              </span>
            </div>

            {/* Email */}
            <div className={styles.inputContainer}>
              <label className={styles.label} htmlFor="email">Email</label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="Введите email"
                value={form.email}
                onChange={handleChange}
                className={styles.input}
                autoComplete="email"
                required
              />
            </div>

            {/* Password */}
            <div className={styles.inputContainer}>
              <label className={styles.label} htmlFor="password">Пароль</label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="Введите пароль"
                value={form.password}
                onChange={handleChange}
                className={styles.input}
                autoComplete="new-password"
                required
              />
              <span className={styles.hint}>Минимум 8 символов, одна заглавная буква</span>
            </div>

            {/* Confirm password */}
            <div className={styles.inputContainer}>
              <label className={styles.label} htmlFor="confirmPassword">Подтвердите пароль</label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                placeholder="Повторите пароль"
                value={form.confirmPassword}
                onChange={handleChange}
                className={styles.input}
                autoComplete="new-password"
                required
              />
            </div>

            {/* Error */}
            {error && <p className={styles.error}>{error}</p>}

            {/* Submit */}
            <button type="submit" className={styles.btnSubmit} disabled={loading}>
              {loading ? 'Создание аккаунта...' : 'Создать аккаунт'}
            </button>
          </form>

          {/* Divider */}
          <div className={styles.divider}>
            <div className={styles.dividerLine} />
            <span className={styles.dividerText}>или войдите через</span>
            <div className={styles.dividerLine} />
          </div>

          {/* Discord OAuth */}
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL}/api/auth/discord`}
            className={styles.btnDiscord}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057.1 18.08.112 18.1.13 18.115a19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03z"/>
            </svg>
            Войти через Discord
          </a>
        </div>
      </div>
    </div>
  );
}
