"""
Генерация bcrypt хеша для пароля
"""
from passlib.context import CryptContext

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

password = "LesnoyBOSS909!"
hash = pwd_context.hash(password)

print(f"Password: {password}")
print(f"Hash: {hash}")
print()
print("SQL для обновления:")
print(f"UPDATE admin_users SET password_hash = '{hash}' WHERE username = 'LesnoyBOSS';")
