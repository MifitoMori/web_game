# Top-Down Shooter — Мультиплеерная игра

Мультиплеерный топ-даун шутер с системой матчмейкинга, магазином скинов и прогрессией игрока.

## Системные требования

- Node.js (версия 18 или выше)
- PostgreSQL (версия 14 или выше)
- npm (версия 9 или выше)

## Установка и запуск

### 1. Клонирование репозитория

```bash
# Клонируем репозиторий (ветка develop_game)
git clone -b develop_game https://github.com/MifitoMori/web_game.git
cd web_game
```

# Если вы уже склонировали репозиторий без указания ветки:

```bash
git checkout develop_game
git pull origin develop_game
```

### 2. Настройка базы данных (Docker)

```bash
# Запускаем PostgreSQL в Docker-контейнере
docker-compose up -d

# Или если Docker не установлен, используйте локальный PostgreSQL
# Создайте базу данных с именем game_backend
```

### 3. Установка зависимостей

```bash
# Устанавливаем зависимости для бэкенда
cd game-backend
npm install

# Возвращаемся в корень проекта
cd ..

# Переходим в директорию с игровым клиентом
cd game_client
npm install

# Возвращаемся в корень
cd ..

# Переходим в веб-клиент (React)
cd web_game
npm install
```

### 4. Настройка переменных окружения
Создайте файл .env в папке game-backend:

```env
DATABASE_URL="postgresql://postgres:1@localhost:5432/game_backend?schema=public"
JWT_SECRET="your-secret-key-here"
JWT_REFRESH_SECRET="your-refresh-secret-key-here"
PORT=3001
```

### 5. Миграции базы данных
```bash
cd game-backend

# Применяем миграции
npx prisma migrate deploy

# Заполняем базу начальными данными (каталог предметов магазина)
npm run db:seed
```
### 6. Запуск проекта
Откройте терминал в корне проекта:

```bash
npm run dev
```

### Как играть

Зарегистрируйтесь или войдите в систему через веб-интерфейс (порт 5173)

Выберите режим игры:

Игра с компьютером — одиночный режим против AI

Игра с человеком — поиск онлайн соперника

Управление:

WASD / Стрелки — движение

Мышь — прицеливание

ЛКМ — стрельба

Shift — рывок (дэш)

R — перезарядка

ESC — меню

### Технологический стек

Компонент	Технологии
Бэкенд	NestJS, Prisma, PostgreSQL, Socket.IO
Игровой движок	Phaser 3
Веб-клиент	React, TypeScript, Mantine UI, Vite
Контейнеризация	Docker, Docker Compose

### Структура проекта

text
project/
├── game-backend/          # NestJS сервер
│   ├── src/modules/
│   │   ├── auth/          # JWT авторизация
│   │   ├── game/          # WebSocket + матчмейкинг
│   │   ├── shop/          # Магазин предметов
│   │   └── users/         # Пользователи
│   └── prisma/            # Миграции БД
├── game_client/           # Phaser игра
│   ├── assets/            # Спрайты и текстуры
│   └── src/
│       ├── scenes/        # GameScene, HUD
│       └── entities/      # Player, Enemy
└── web_game/              # React приложение
    ├── src/pages/         # Лобби, игра, профиль
    └── src/components/    # UI компоненты
    
### Возможные проблемы

Порты уже заняты
Измените порты в соответствующих конфигах

Для бэкенда: измените PORT в .env

Для игры: измените порт в команде http-server -p 8080

Ошибка подключения к БД
Убедитесь, что Docker-контейнер запущен: docker ps

Проверьте DATABASE_URL в .env

Попробуйте перезапустить контейнер: docker-compose restart

WebSocket не работает
Проверьте, что бэкенд запущен на порту 3001

Убедитесь, что в браузере нет блокировки WebSocket

При запуске с разных устройств замените localhost на IP-адрес сервера
