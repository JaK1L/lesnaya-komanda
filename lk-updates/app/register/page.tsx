import type { Metadata } from 'next';
import RegisterPage from './RegisterPage';

export const metadata: Metadata = {
  title: 'Регистрация — Лесная Команда',
  description: 'Создай аккаунт и вступи в лесную команду',
};

export default function Page() {
  return <RegisterPage />;
}
