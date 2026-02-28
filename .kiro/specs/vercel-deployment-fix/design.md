# Vercel Deployment Fix - Bugfix Design

## Overview

Деплой Next.js приложения на Vercel завершается неудачей из-за критической уязвимости безопасности в Next.js 14.0.3. Vercel блокирует сборку, требуя обновления до патченной версии. Исправление включает обновление Next.js с 14.0.3 до последней стабильной версии 14.x (14.2.x или выше), проверку совместимости всех зависимостей и обеспечение успешного деплоя без регрессий в существующей функциональности.

## Glossary

- **Bug_Condition (C)**: Условие, вызывающее ошибку - использование Next.js 14.0.3 с известной уязвимостью безопасности при деплое на Vercel
- **Property (P)**: Желаемое поведение - успешная сборка и деплой на Vercel без предупреждений о безопасности
- **Preservation**: Существующая функциональность приложения (dev режим, компоненты React, зависимости) должна остаться неизменной
- **package.json**: Файл в `frontend/package.json`, содержащий список зависимостей и их версий
- **Vercel Build Process**: Процесс сборки на платформе Vercel, который проверяет версии зависимостей на наличие уязвимостей
- **Next.js App Router**: Архитектура приложения, использующая директорию `app/` для маршрутизации (Next.js 13+)

## Bug Details

### Fault Condition

Ошибка проявляется, когда Vercel пытается собрать приложение с Next.js 14.0.3, которая содержит критическую уязвимость безопасности. Vercel обнаруживает уязвимую версию во время процесса сборки и прерывает деплой с предупреждением о необходимости обновления.

**Formal Specification:**
```
FUNCTION isBugCondition(deploymentContext)
  INPUT: deploymentContext of type VercelDeployment
  OUTPUT: boolean
  
  RETURN deploymentContext.platform == 'Vercel'
         AND deploymentContext.nextJsVersion == '14.0.3'
         AND deploymentContext.buildCommand == 'npm run build'
         AND NOT deploymentContext.buildSuccessful
         AND deploymentContext.securityWarning == true
END FUNCTION
```

### Examples

- **Пример 1**: Деплой на Vercel с Next.js 14.0.3 → Сборка прерывается с сообщением "This version has a security vulnerability. Please upgrade to a patched version"
- **Пример 2**: Выполнение `npm run build` на Vercel → Процесс завершается с ошибкой, production build не создается
- **Пример 3**: Vercel проверяет зависимости → Обнаруживается уязвимость в Next.js 14.0.3, деплой блокируется
- **Ожидаемое поведение**: Деплой на Vercel с Next.js 14.2.x → Сборка завершается успешно, приложение деплоится без предупреждений

## Expected Behavior

### Preservation Requirements

**Unchanged Behaviors:**
- Локальная разработка с `npm run dev` должна продолжать работать корректно
- Существующие компоненты React (react 18.2.0, react-dom 18.2.0) должны функционировать без изменений
- Зависимости axios, framer-motion, lucide-react должны работать корректно
- TypeScript 5.9.3 и Tailwind CSS 4.2.1 должны оставаться совместимыми
- Существующие страницы и компоненты в `app/` должны отображаться и функционировать идентично

**Scope:**
Все входные данные, которые НЕ связаны с процессом деплоя на Vercel (локальная разработка, существующие компоненты, UI), должны быть полностью не затронуты этим исправлением. Это включает:
- Локальный dev сервер (`npm run dev`)
- Существующие React компоненты и страницы
- Клиентские зависимости (axios, framer-motion, lucide-react)
- Конфигурация TypeScript и Tailwind CSS

## Hypothesized Root Cause

На основе описания ошибки, наиболее вероятные причины:

1. **Уязвимость безопасности в Next.js 14.0.3**: Версия 14.0.3 содержит известную критическую уязвимость, которую Vercel обнаруживает и блокирует
   - Vercel имеет встроенную проверку безопасности зависимостей
   - Уязвимые версии автоматически блокируются на этапе сборки

2. **Устаревшая версия Next.js**: Версия 14.0.3 была выпущена в начале цикла Next.js 14, последующие патчи исправили критические проблемы
   - Рекомендуется использовать последнюю стабильную версию 14.x (14.2.x или выше)

3. **Несовместимость с политиками безопасности Vercel**: Vercel требует использования патченных версий для production деплоя
   - Локальная сборка может работать, но Vercel блокирует уязвимые версии

4. **Отсутствие обновлений зависимостей**: package.json не обновлялся с момента первоначальной установки Next.js 14.0.3

## Correctness Properties

Property 1: Fault Condition - Successful Vercel Deployment

_For any_ deployment context where Next.js is updated to a patched version (14.2.x or higher) and deployed to Vercel, the build process SHALL complete successfully without security warnings, creating a production build and deploying the application.

**Validates: Requirements 2.1, 2.2, 2.3**

Property 2: Preservation - Existing Functionality

_For any_ development context that does NOT involve Vercel deployment (local development, existing components, client dependencies), the updated Next.js version SHALL produce exactly the same behavior as the original version, preserving all existing functionality including dev server, React components, and third-party dependencies.

**Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**

## Fix Implementation

### Changes Required

Assuming our root cause analysis is correct:

**File**: `frontend/package.json`

**Function**: Dependency management

**Specific Changes**:
1. **Update Next.js version**: Изменить версию Next.js с `14.0.3` на `^14.2.0` или последнюю стабильную версию 14.x
   - Использовать caret (^) для автоматического получения патчей
   - Проверить release notes Next.js для breaking changes между 14.0.3 и 14.2.x

2. **Verify React compatibility**: Убедиться, что React 18.2.0 совместим с обновленной версией Next.js
   - Next.js 14.2.x поддерживает React 18.2.0
   - Обновление React не требуется

3. **Check TypeScript types compatibility**: Проверить совместимость @types/react и @types/node с новой версией Next.js
   - @types/react 19.2.14 может потребовать корректировки
   - @types/node 25.3.2 должен быть совместим

4. **Verify third-party dependencies**: Убедиться, что axios, framer-motion, lucide-react совместимы с Next.js 14.2.x
   - Эти библиотеки не зависят напрямую от версии Next.js
   - Совместимость должна сохраниться

5. **Update package-lock.json**: Выполнить `npm install` для обновления lock файла
   - Это обеспечит консистентность зависимостей
   - Vercel будет использовать обновленный lock файл при деплое

### Implementation Steps

1. Обновить `frontend/package.json`: изменить `"next": "14.0.3"` на `"next": "^14.2.0"`
2. Выполнить `npm install` в директории `frontend/`
3. Проверить локальную сборку: `npm run build`
4. Проверить dev режим: `npm run dev`
5. Протестировать существующие страницы и компоненты
6. Закоммитить изменения и задеплоить на Vercel

## Testing Strategy

### Validation Approach

Стратегия тестирования следует двухфазному подходу: сначала продемонстрировать ошибку на неисправленном коде (Next.js 14.0.3 на Vercel), затем проверить, что исправление работает корректно и сохраняет существующее поведение.

### Exploratory Fault Condition Checking

**Goal**: Продемонстрировать ошибку ПЕРЕД внедрением исправления. Подтвердить или опровергнуть анализ первопричины. Если опровергнем, потребуется пересмотр гипотезы.

**Test Plan**: Попытаться задеплоить приложение на Vercel с текущей версией Next.js 14.0.3. Запустить эти тесты на НЕИСПРАВЛЕННОМ коде для наблюдения ошибок и понимания первопричины.

**Test Cases**:
1. **Vercel Deployment Test**: Задеплоить на Vercel с Next.js 14.0.3 (будет падать на неисправленном коде)
2. **Build Command Test**: Выполнить `npm run build` на Vercel (будет падать на неисправленном коде)
3. **Security Check Test**: Проверить вывод Vercel на наличие предупреждений о безопасности (будет показывать предупреждение на неисправленном коде)
4. **Local Build Test**: Выполнить `npm run build` локально (может работать на неисправленном коде, так как локальная сборка не проверяет уязвимости)

**Expected Counterexamples**:
- Vercel блокирует деплой с сообщением о уязвимости безопасности
- Возможные причины: уязвимая версия Next.js 14.0.3, политики безопасности Vercel, отсутствие патчей

### Fix Checking

**Goal**: Проверить, что для всех входных данных, где выполняется условие ошибки, исправленная функция производит ожидаемое поведение.

**Pseudocode:**
```
FOR ALL deploymentContext WHERE isBugCondition(deploymentContext) DO
  result := deployToVercel_fixed(deploymentContext)
  ASSERT result.buildSuccessful == true
  ASSERT result.securityWarning == false
  ASSERT result.deploymentStatus == 'success'
END FOR
```

### Preservation Checking

**Goal**: Проверить, что для всех входных данных, где условие ошибки НЕ выполняется, исправленная функция производит тот же результат, что и оригинальная функция.

**Pseudocode:**
```
FOR ALL developmentContext WHERE NOT isBugCondition(developmentContext) DO
  ASSERT originalNextJs(developmentContext) = fixedNextJs(developmentContext)
END FOR
```

**Testing Approach**: Property-based тестирование рекомендуется для проверки сохранения поведения, потому что:
- Оно автоматически генерирует множество тестовых случаев в области входных данных
- Оно ловит граничные случаи, которые могут пропустить ручные unit тесты
- Оно предоставляет сильные гарантии, что поведение не изменилось для всех не-багованных входных данных

**Test Plan**: Наблюдать поведение на НЕИСПРАВЛЕННОМ коде сначала для локальной разработки и существующих компонентов, затем написать property-based тесты, захватывающие это поведение.

**Test Cases**:
1. **Local Dev Server Preservation**: Наблюдать, что `npm run dev` работает корректно на неисправленном коде, затем написать тест для проверки, что это продолжается после исправления
2. **React Components Preservation**: Наблюдать, что существующие компоненты в `app/` отображаются корректно на неисправленном коде, затем написать тест для проверки, что это продолжается после исправления
3. **Dependencies Preservation**: Наблюдать, что axios, framer-motion, lucide-react работают корректно на неисправленном коде, затем написать тест для проверки, что это продолжается после исправления
4. **TypeScript/Tailwind Preservation**: Наблюдать, что TypeScript компиляция и Tailwind стили работают корректно на неисправленном коде, затем написать тест для проверки, что это продолжается после исправления

### Unit Tests

- Тест успешной сборки на Vercel с обновленной версией Next.js
- Тест отсутствия предупреждений о безопасности в выводе Vercel
- Тест локальной сборки с `npm run build`
- Тест dev сервера с `npm run dev`
- Тест загрузки существующих страниц (`app/page.tsx`, `app/admin/*`)

### Property-Based Tests

- Генерировать случайные конфигурации деплоя и проверять успешность сборки на Vercel
- Генерировать случайные сценарии локальной разработки и проверять сохранение поведения dev сервера
- Тестировать, что все существующие компоненты продолжают работать в различных сценариях

### Integration Tests

- Тест полного flow деплоя на Vercel: commit → push → Vercel build → deployment success
- Тест переключения между dev и production режимами
- Тест, что визуальное отображение страниц не изменилось после обновления Next.js
- Тест работы всех зависимостей (axios запросы, framer-motion анимации, lucide-react иконки) в production build
