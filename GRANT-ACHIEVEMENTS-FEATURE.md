# 🏆 Функция выдачи достижений в админке

**Дата:** 07.03.2026  
**Статус:** Backend готов, нужен frontend

## Backend API

### Эндпоинт для выдачи достижения

```
POST /api/achievements/grant/{user_id}/{achievement_type_id}
```

**Требуется:** Авторизация админа (Bearer token)

**Параметры:**
- `user_id` (path) - ID пользователя в базе (не Discord ID!)
- `achievement_type_id` (path) - ID типа достижения

**Ответ:**
```json
{
  "message": "Достижение выдано"
}
```

**Ошибки:**
- `404` - Пользователь или достижение не найдено
- `400` - Достижение уже выдано этому пользователю
- `403` - Недостаточно прав (не админ)

### Вспомогательные эндпоинты

#### Получить список пользователей
```
GET /api/users?limit=100
GET /api/players?limit=100
```

Возвращает список всех пользователей с их `id` и `discord_username`.

#### Получить список достижений
```
GET /api/achievements/types
```

Возвращает все типы достижений с их `id` и `name`.

#### Получить достижения пользователя
```
GET /api/achievements/user/{discord_id}
```

Показывает какие достижения уже есть у пользователя.

## Frontend UI - Предложение

### Вариант 1: Модальное окно на странице достижений

На странице `/admin/achievements` добавить кнопку "Выдать достижение":

```tsx
// Компонент для выдачи достижения
<Modal>
  <h2>Выдать достижение</h2>
  
  {/* Шаг 1: Выбор пользователя */}
  <Select 
    label="Пользователь"
    options={users}
    value={selectedUser}
    onChange={setSelectedUser}
    searchable
  />
  
  {/* Шаг 2: Выбор достижения */}
  <Select
    label="Достижение"
    options={achievements}
    value={selectedAchievement}
    onChange={setSelectedAchievement}
  />
  
  {/* Показать уже полученные достижения */}
  {selectedUser && (
    <div>
      <h3>Уже получено:</h3>
      <ul>
        {userAchievements.map(a => (
          <li key={a.id}>{a.icon} {a.name}</li>
        ))}
      </ul>
    </div>
  )}
  
  {/* Кнопка выдачи */}
  <Button onClick={handleGrant}>
    Выдать достижение
  </Button>
</Modal>
```

### Вариант 2: На странице пользователя

На странице `/admin/users/{id}` добавить раздел "Достижения":

```tsx
<div>
  <h3>Достижения пользователя</h3>
  
  {/* Список полученных */}
  <div>
    <h4>Получено ({userAchievements.length}):</h4>
    {userAchievements.map(a => (
      <Badge key={a.id}>
        {a.icon} {a.name}
      </Badge>
    ))}
  </div>
  
  {/* Выдать новое */}
  <div>
    <h4>Выдать новое:</h4>
    <Select
      options={availableAchievements}
      onChange={handleGrant}
    />
  </div>
</div>
```

### Вариант 3: Быстрая выдача на странице достижений

На странице `/admin/achievements` у каждого достижения кнопка "Выдать":

```tsx
{achievements.map(achievement => (
  <Card key={achievement.id}>
    <div>
      <span>{achievement.icon}</span>
      <h3>{achievement.name}</h3>
      <p>{achievement.description}</p>
    </div>
    
    {/* Кнопка выдачи */}
    <Button onClick={() => openGrantModal(achievement)}>
      Выдать пользователю
    </Button>
  </Card>
))}
```

## Пример кода для frontend

### Получить список пользователей

```typescript
const fetchUsers = async () => {
  const response = await fetch(`${API_URL}/api/users?limit=1000`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const users = await response.json();
  return users;
};
```

### Получить достижения пользователя

```typescript
const fetchUserAchievements = async (discordId: number) => {
  const response = await fetch(
    `${API_URL}/api/achievements/user/${discordId}`
  );
  const achievements = await response.json();
  return achievements;
};
```

### Выдать достижение

```typescript
const grantAchievement = async (
  userId: number, 
  achievementTypeId: number
) => {
  try {
    const response = await fetch(
      `${API_URL}/api/achievements/grant/${userId}/${achievementTypeId}`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Ошибка при выдаче достижения');
    }
    
    const result = await response.json();
    alert(result.message); // "Достижение выдано"
    
    // Обновить список достижений пользователя
    await fetchUserAchievements(discordId);
    
  } catch (error) {
    alert(error.message);
  }
};
```

### Полный компонент

```typescript
import { useState, useEffect } from 'react';

interface User {
  id: number;
  discord_id: number;
  discord_username: string;
}

interface Achievement {
  id: number;
  name: string;
  icon: string;
  description: string;
}

export function GrantAchievementModal({ isOpen, onClose }) {
  const [users, setUsers] = useState<User[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [userAchievements, setUserAchievements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedUser) {
      loadUserAchievements(selectedUser.discord_id);
    }
  }, [selectedUser]);

  const loadData = async () => {
    const [usersData, achievementsData] = await Promise.all([
      fetch(`${API_URL}/api/users?limit=1000`).then(r => r.json()),
      fetch(`${API_URL}/api/achievements/types`).then(r => r.json())
    ]);
    
    setUsers(usersData);
    setAchievements(achievementsData);
  };

  const loadUserAchievements = async (discordId: number) => {
    const data = await fetch(
      `${API_URL}/api/achievements/user/${discordId}`
    ).then(r => r.json());
    
    setUserAchievements(data);
  };

  const handleGrant = async () => {
    if (!selectedUser || !selectedAchievement) {
      alert('Выберите пользователя и достижение');
      return;
    }

    setLoading(true);
    
    try {
      const response = await fetch(
        `${API_URL}/api/achievements/grant/${selectedUser.id}/${selectedAchievement.id}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail);
      }

      alert('✅ Достижение успешно выдано!');
      
      // Обновить список достижений пользователя
      await loadUserAchievements(selectedUser.discord_id);
      
      // Сбросить выбор
      setSelectedAchievement(null);
      
    } catch (error) {
      alert(`❌ Ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Фильтруем достижения которые уже есть у пользователя
  const availableAchievements = achievements.filter(
    a => !userAchievements.some(ua => ua.achievement_type_id === a.id)
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <h2>🏆 Выдать достижение</h2>
      
      {/* Выбор пользователя */}
      <div>
        <label>Пользователь:</label>
        <select 
          value={selectedUser?.id || ''} 
          onChange={(e) => {
            const user = users.find(u => u.id === Number(e.target.value));
            setSelectedUser(user || null);
          }}
        >
          <option value="">Выберите пользователя</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>
              {user.discord_username}
            </option>
          ))}
        </select>
      </div>

      {/* Показать уже полученные достижения */}
      {selectedUser && userAchievements.length > 0 && (
        <div>
          <h3>Уже получено ({userAchievements.length}):</h3>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {userAchievements.map(a => (
              <span key={a.id} style={{ 
                padding: '4px 8px', 
                background: '#2a2a2a', 
                borderRadius: '4px' 
              }}>
                {a.icon} {a.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Выбор достижения */}
      {selectedUser && (
        <div>
          <label>Достижение:</label>
          <select
            value={selectedAchievement?.id || ''}
            onChange={(e) => {
              const achievement = achievements.find(
                a => a.id === Number(e.target.value)
              );
              setSelectedAchievement(achievement || null);
            }}
          >
            <option value="">Выберите достижение</option>
            {availableAchievements.map(achievement => (
              <option key={achievement.id} value={achievement.id}>
                {achievement.icon} {achievement.name} ({achievement.points} поинтов)
              </option>
            ))}
          </select>
          
          {selectedAchievement && (
            <p style={{ color: '#888', fontSize: '14px' }}>
              {selectedAchievement.description}
            </p>
          )}
        </div>
      )}

      {/* Кнопки */}
      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
        <button 
          onClick={handleGrant} 
          disabled={!selectedUser || !selectedAchievement || loading}
          style={{
            padding: '8px 16px',
            background: '#4CAF50',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {loading ? 'Выдача...' : 'Выдать достижение'}
        </button>
        
        <button 
          onClick={onClose}
          style={{
            padding: '8px 16px',
            background: '#666',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Отмена
        </button>
      </div>
    </Modal>
  );
}
```

## Использование компонента

```typescript
// В админ панели
import { GrantAchievementModal } from './GrantAchievementModal';

function AchievementsAdminPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div>
      <h1>Управление достижениями</h1>
      
      <button onClick={() => setIsModalOpen(true)}>
        🏆 Выдать достижение пользователю
      </button>

      <GrantAchievementModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
      
      {/* Остальной контент страницы */}
    </div>
  );
}
```

## Тестирование через Swagger

Пока frontend не готов, можно тестировать через Swagger:

1. Открой: https://lesnayakomanda.onrender.com/api/docs
2. Авторизуйся (кнопка Authorize, введи Bearer token)
3. Найди `POST /api/achievements/grant/{user_id}/{achievement_type_id}`
4. Try it out
5. Введи `user_id` и `achievement_type_id`
6. Execute

## Примечания

### Важно: user_id vs discord_id

- API принимает `user_id` (ID в таблице users)
- Но для получения достижений используется `discord_id`
- Нужно конвертировать: получить user по discord_id, взять его id

### Альтернатива: Изменить API

Можно изменить эндпоинт чтобы принимал discord_id вместо user_id:

```python
@router.post("/grant-by-discord/{discord_id}/{achievement_type_id}")
async def grant_achievement_by_discord(
    discord_id: int,
    achievement_type_id: int,
    db: asyncpg.Connection = Depends(get_db),
    current_user: User = Depends(get_current_admin_user),
):
    # Получаем user_id по discord_id
    user = await db.fetchrow("SELECT id FROM users WHERE discord_id = $1", discord_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    
    # Дальше как обычно...
```

Это упростит frontend код.

---

**Статус:** Backend готов, нужна реализация UI  
**Приоритет:** Средний  
**Сложность:** Низкая (1-2 часа работы)
