"""
Генерация bcrypt хеша для пароля
"""
import os
from dotenv import load_dotenv
from passlib.context import CryptContext

load_dotenv()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Читаем пароль из переменных окружения или используем аргумент
password = os.getenv('ADMIN_PASSWORD', 'admin123')
username = os.getenv('ADMIN_USERNAME', 'admin')

hash = pwd_context.hash(password)

print(f"Username: {username}")
print(f"Password: {password}")
print(f"Hash: {hash}")
print()
print("SQL для обновления:")
print(f"UPDATE admin_users SET password_hash = '{hash}' WHERE username = '{username}';")
