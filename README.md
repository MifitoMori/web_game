# Web Game

Мультиплеерный топ-даун шутер с системой матчмейкинга, магазином скинов и прогрессией игрока.

Проект состоит из трех частей:

- `game-backend` - backend на NestJS, Prisma и PostgreSQL.
- `web_game` - основной frontend на React.
- `game_client` - игровой клиент на Phaser.

## Требования

Перед запуском требуется установить:

- PostgreSQL (версия 14 или выше)
- Node.js (20 или новее)
- npm
- Docker

### Клонирование репозитория

```bash
# Клонируем репозиторий (ветка develop_game)
git clone -b develop_game https://github.com/MifitoMori/web_game.git
cd web_game
```

## Установка зависимостей

Из корня проекта выполните:

```bash
npm install
npm --prefix game-backend install
npm --prefix web_game install
npm --prefix game_client install
```

## Настройка backend

Создайте файл `game-backend/.env`:

```env
DATABASE_URL="postgresql://postgres:1@localhost:5432/game_backend?schema=public"
JWT_SECRET="dev-secret-key"
PORT=3001
```

## Запуск базы данных

Запустите:

```bash
cd game-backend
docker compose up -d
```

Контейнер поднимет базу `game_backend` на порту `5432` с пользователем `postgres` и паролем `1`.

## Миграции и seed

После запуска базы выполните подготовку Prisma:

```bash
cd game-backend
npx prisma migrate deploy
npm run db:setup
```

Команда генерирует Prisma Client, применяет миграции.

## Запуск проекта

Вернитесь в корень проекта и запустите все части одной командой:

```bash
npm run dev
```

Будут запущены:

- backend: `http://localhost:3001`
- Swagger API docs: `http://localhost:3001/api/docs`
- frontend: `http://localhost:3000`
- игровой клиент: `http://localhost:8080`

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

## Полезные команды

Остановить PostgreSQL:

```bash
cd game-backend
docker compose down
```

Остановить PostgreSQL и удалить локальные данные:

```bash
cd game-backend
docker compose down -v
```

Повторно применить миграции и seed после очистки базы:

```bash
cd game-backend
npm run db:setup
```
