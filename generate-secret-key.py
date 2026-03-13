#!/usr/bin/env python3
"""
Генератор SECRET_KEY для Fly.io
Использование: python generate-secret-key.py
"""

import secrets
import string

def generate_secret_key(length=64):
    """Генерирует криптографически безопасный секретный ключ"""
    alphabet = string.ascii_letters + string.digits + string.punctuation
    # Убираем символы, которые могут вызвать проблемы в shell
    alphabet = alphabet.replace('"', '').replace("'", '').replace('\\', '').replace('`', '')
    return ''.join(secrets.choice(alphabet) for _ in range(length))

if __name__ == "__main__":
    secret_key = generate_secret_key()
    
    print("=" * 80)
    print("🔐 Сгенерирован новый SECRET_KEY для Fly.io")
    print("=" * 80)
    print()
    print(f"SECRET_KEY={secret_key}")
    print()
    print("=" * 80)
    print()
    print("Установите его в Fly.io:")
    print(f'fly secrets set SECRET_KEY="{secret_key}"')
    print()
    print("Или добавьте в файл fly-secrets.txt:")
    print(f'SECRET_KEY={secret_key}')
    print()
    print("⚠️  ВАЖНО: Сохраните этот ключ в безопасном месте!")
    print("=" * 80)
