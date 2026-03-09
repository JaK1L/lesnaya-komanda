#!/bin/bash

echo "🔍 Проверка главной страницы..."
echo ""

# Проверка существования файлов
echo "📁 Проверка файлов:"
files=(
  "frontend/app/page.tsx"
  "frontend/components/home/HeroSection.tsx"
  "frontend/components/home/HeroSection.module.css"
  "frontend/components/home/StreamersSection.tsx"
  "frontend/components/home/StreamersSection.module.css"
  "frontend/components/home/NewsSection.tsx"
  "frontend/components/home/NewsSection.module.css"
  "frontend/components/layout/Navigation.tsx"
  "frontend/components/layout/Navigation.module.css"
  "frontend/components/layout/Footer.tsx"
  "frontend/components/layout/Footer.module.css"
)

for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    echo "✅ $file"
  else
    echo "❌ $file - НЕ НАЙДЕН"
  fi
done

echo ""
echo "🚀 Для запуска проекта:"
echo "cd frontend && npm install && npm run dev"
