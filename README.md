# Web Game

Проект состоит из трех частей:

- `game-backend` - backend на NestJS, Prisma и PostgreSQL.
- `web_game` - основной frontend на React.
- `game_client` - игровой клиент на Phaser.

## Требования

Перед запуском требуется установить:

- Node.js 20 или новее
- npm
- Docker

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
