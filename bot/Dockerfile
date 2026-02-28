FROM python:3.12-slim

WORKDIR /app

# Копируем requirements
COPY requirements.txt .

# Устанавливаем зависимости
RUN pip install --no-cache-dir -r requirements.txt

# Копируем код бота
COPY main.py .

# Запускаем бота
CMD ["python", "main.py"]
