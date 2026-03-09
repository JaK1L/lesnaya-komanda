"""
Скрипт для проверки JWT токена
"""
import os
from jose import jwt, JWTError
from dotenv import load_dotenv

# Загружаем переменные окружения
load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")

def check_token(token: str):
    """Проверка JWT токена"""
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        print("✅ Токен валидный!")
        print(f"Payload: {payload}")
        print(f"Username (sub): {payload.get('sub')}")
        print(f"Type: {payload.get('type', 'admin (default)')}")
        print(f"Expires: {payload.get('exp')}")
        return True
    except JWTError as e:
        print(f"❌ Ошибка валидации токена: {e}")
        return False

if __name__ == "__main__":
    print("=== Проверка JWT токена ===\n")
    print(f"SECRET_KEY: {SECRET_KEY[:20]}...")
    print(f"ALGORITHM: {ALGORITHM}\n")
    
    # Вставьте сюда токен из браузера (localStorage.getItem('admin_token'))
    token = input("Введите токен для проверки: ").strip()
    
    if token:
        check_token(token)
    else:
        print("Токен не введен")
