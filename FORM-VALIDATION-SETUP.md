# ✅ Form Validation - Клиентская валидация

## Реализовано

### 1. Библиотека валидации

#### Validation Rules
**Файл:** `frontend/lib/validation.ts`

Набор переиспользуемых правил валидации:

**Базовые правила:**
- `required()` - обязательное поле
- `minLength(n)` - минимальная длина
- `maxLength(n)` - максимальная длина
- `email()` - валидация email
- `url()` - валидация URL
- `min(n)` - минимальное значение числа
- `max(n)` - максимальное значение числа
- `pattern(regex)` - проверка по регулярному выражению
- `fileSize(mb)` - максимальный размер файла
- `fileType(types)` - разрешенные типы файлов
- `custom(fn, msg)` - кастомная валидация

**Использование:**
```typescript
import { rules } from '@/lib/validation'

const titleRule = rules.required('Заголовок обязателен')
const emailRule = rules.email('Неверный формат email')
const urlRule = rules.url()
```

#### FormValidator Class
Класс для создания валидаторов форм:

```typescript
const validator = new FormValidator()
  .field('title', 
    rules.required('Заголовок обязателен'),
    rules.minLength(3, 'Минимум 3 символа'),
    rules.maxLength(200, 'Максимум 200 символов')
  )
  .field('email',
    rules.required(),
    rules.email()
  )

// Валидация всей формы
const result = validator.validate(formData)
if (!result.isValid) {
  console.log(result.errors) // { title: 'Заголовок обязателен' }
}

// Валидация одного поля
const error = validator.validateField('title', 'ab')
// 'Минимум 3 символа'
```

#### useFormValidation Hook
React хук для управления ошибками валидации:

```typescript
const { errors, validateForm, validateField, clearError, clearErrors } = useFormValidation()

// Валидация формы
const handleSubmit = (e) => {
  e.preventDefault()
  if (!validateForm(validator, formData)) {
    return // Есть ошибки
  }
  // Отправка формы
}

// Валидация поля при изменении
const handleChange = (name, value) => {
  setFormData({ ...formData, [name]: value })
  validateField(validator, name, value)
}
```

### 2. UI компоненты

#### FormError
**Файл:** `frontend/components/ui/FormError/FormError.tsx`

Компонент для отображения ошибки валидации:

```tsx
<FormError error={errors.title} />
```

**Особенности:**
- Иконка AlertCircle
- Красный фон с прозрачностью
- Анимация появления (slideIn)
- Accessibility (role="alert")

#### FormField
Обертка для поля формы с label и ошибкой:

```tsx
<FormField label="Заголовок" error={errors.title} required htmlFor="title">
  <input
    id="title"
    type="text"
    value={formData.title}
    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
  />
</FormField>
```

**Особенности:**
- Автоматический label
- Звездочка для обязательных полей
- Отображение ошибки под полем
- Красная рамка у input при ошибке

### 3. Обновленные формы

#### News Form (Новости)
**Файл:** `frontend/app/admin/news/page.tsx`

**Валидация:**
- ✅ Заголовок: обязательно, 3-200 символов
- ✅ Содержание: обязательно, 10-5000 символов

**Поведение:**
- Валидация при отправке формы
- Показ ошибок под полями
- Блокировка отправки при ошибках
- Очистка ошибок при отмене

#### Streamers Form (Стримеры)
**Файл:** `frontend/app/admin/streamers/page.tsx`

**Валидация:**
- ✅ Имя: обязательно, 2-100 символов
- ✅ Ссылка на канал: обязательно, валидный URL

**Поведение:**
- Валидация при отправке
- Показ ошибок
- Блокировка отправки при ошибках
- Очистка ошибок при отмене

### 4. Стили

**Файл:** `frontend/components/ui/FormError/FormError.module.css`

**Ошибка:**
- Красный фон с прозрачностью
- Иконка + текст
- Анимация slideIn (0.2s)
- Поддержка prefers-reduced-motion

**Поле с ошибкой:**
- Красная рамка у input/textarea/select
- Красная тень при фокусе
- CSS селектор `:has(.error)` для автоматического стиля

## Архитектура

```
Validation System
├── Rules (validation.ts)
│   ├── required
│   ├── minLength/maxLength
│   ├── email/url
│   ├── min/max
│   └── custom
├── FormValidator (validation.ts)
│   ├── field() - добавить правила для поля
│   ├── validate() - валидация всей формы
│   └── validateField() - валидация одного поля
├── useFormValidation (validation.ts)
│   ├── errors - объект с ошибками
│   ├── validateForm() - валидация формы
│   ├── validateField() - валидация поля
│   └── clearErrors() - очистка ошибок
└── UI Components
    ├── FormError - отображение ошибки
    └── FormField - обертка для поля
```

## Примеры использования

### Простая форма

```tsx
import { FormValidator, rules, useFormValidation } from '@/lib/validation'
import { FormField } from '@/components/ui/FormError'

function MyForm() {
  const [formData, setFormData] = useState({ name: '', email: '' })
  const { errors, validateForm, clearErrors } = useFormValidation()

  const validator = new FormValidator()
    .field('name', rules.required(), rules.minLength(2))
    .field('email', rules.required(), rules.email())

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm(validator, formData)) {
      return // Есть ошибки
    }
    
    // Отправка формы
    console.log('Form is valid!', formData)
  }

  return (
    <form onSubmit={handleSubmit}>
      <FormField label="Имя" error={errors.name} required>
        <input
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        />
      </FormField>

      <FormField label="Email" error={errors.email} required>
        <input
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
        />
      </FormField>

      <button type="submit">Отправить</button>
    </form>
  )
}
```

### Валидация при изменении поля

```tsx
const handleChange = (name: string, value: any) => {
  setFormData({ ...formData, [name]: value })
  
  // Валидация при изменении (опционально)
  validateField(validator, name, value)
}

<input
  value={formData.name}
  onChange={(e) => handleChange('name', e.target.value)}
  onBlur={() => validateField(validator, 'name', formData.name)}
/>
```

### Кастомная валидация

```tsx
const validator = new FormValidator()
  .field('password', 
    rules.required(),
    rules.minLength(8),
    rules.custom(
      (value) => /[A-Z]/.test(value),
      'Пароль должен содержать заглавную букву'
    ),
    rules.custom(
      (value) => /[0-9]/.test(value),
      'Пароль должен содержать цифру'
    )
  )
```

### Валидация файлов

```tsx
const validator = new FormValidator()
  .field('avatar',
    rules.fileSize(5, 'Максимум 5MB'),
    rules.fileType(['image/'], 'Только изображения')
  )

const handleFileChange = (e) => {
  const file = e.target.files?.[0]
  if (file) {
    const error = validator.validateField('avatar', file)
    if (error) {
      alert(error)
      return
    }
    // Загрузка файла
  }
}
```

## Преимущества

### 1. Лучший UX
- Мгновенная обратная связь
- Понятные сообщения об ошибках
- Блокировка отправки невалидных форм
- Визуальные индикаторы (красная рамка)

### 2. Переиспользуемость
- Правила валидации можно комбинировать
- Один валидатор для всей формы
- Компоненты FormField/FormError универсальны

### 3. Типобезопасность
- TypeScript типы для всех функций
- Автокомплит в IDE
- Проверка типов на этапе компиляции

### 4. Accessibility
- `role="alert"` для ошибок
- Связь label с input через htmlFor
- Визуальные и текстовые индикаторы

## Best Practices

### Когда валидировать:
1. **При отправке формы** (обязательно)
   ```tsx
   const handleSubmit = (e) => {
     e.preventDefault()
     if (!validateForm(validator, formData)) return
     // Submit
   }
   ```

2. **При потере фокуса** (onBlur) - для лучшего UX
   ```tsx
   <input
     onBlur={() => validateField(validator, 'email', formData.email)}
   />
   ```

3. **При изменении** (onChange) - только для критичных полей
   ```tsx
   <input
     onChange={(e) => {
       setFormData({ ...formData, email: e.target.value })
       validateField(validator, 'email', e.target.value)
     }}
   />
   ```

### Сообщения об ошибках:
- Конкретные и понятные
- На языке пользователя
- Указывают как исправить
- Не технические термины

**Хорошо:**
- "Минимум 3 символа"
- "Неверный формат email"
- "Пароль должен содержать цифру"

**Плохо:**
- "Validation failed"
- "Invalid input"
- "Error: field_required"

### Очистка ошибок:
```tsx
// При отмене формы
const handleCancel = () => {
  setFormData(initialData)
  clearErrors()
  setShowForm(false)
}

// При успешной отправке
const handleSubmit = async () => {
  if (!validateForm(validator, formData)) return
  
  await saveData()
  clearErrors()
  setShowForm(false)
}
```

## Следующие шаги

Из списка критичных улучшений:
1. ✅ Переменные окружения - ГОТОВО
2. ✅ Error boundaries - ГОТОВО
3. ✅ Loading states - ГОТОВО
4. ✅ Валидация форм - ГОТОВО

## Дополнительные улучшения (опционально)

### Можно добавить:
1. Валидацию в реальном времени (debounced)
2. Async валидацию (проверка на сервере)
3. Зависимые поля (password confirmation)
4. Мультиязычные сообщения
5. Интеграция с react-hook-form

### Пример async валидации:
```typescript
const checkUsernameAvailable = async (username: string) => {
  const response = await fetch(`/api/check-username?username=${username}`)
  const data = await response.json()
  return data.available
}

const validator = new FormValidator()
  .field('username',
    rules.required(),
    rules.custom(
      async (value) => await checkUsernameAvailable(value),
      'Имя пользователя уже занято'
    )
  )
```

## Дата
07.03.2026
