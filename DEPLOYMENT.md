# Руководство по развертыванию проекта

## Настройка SSH ключа

### 1. Генерация SSH ключа

```bash
# Создайте новый SSH ключ (если у вас его еще нет)
ssh-keygen -t ed25519 -C "your_email@example.com"

# Или используйте RSA (если ed25519 не поддерживается)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Ключи будут сохранены в:
# ~/.ssh/id_ed25519 (приватный ключ)
# ~/.ssh/id_ed25519.pub (публичный ключ)
```

### 2. Добавление ключа на сервер

```bash
# Скопируйте публичный ключ на сервер
ssh-copy-id user@your-server.com

# Или вручную добавьте содержимое ~/.ssh/id_ed25519.pub в файл
# ~/.ssh/authorized_keys на сервере
```

### 3. Проверка подключения

```bash
# Проверьте SSH подключение
ssh user@your-server.com

# Если все настроено правильно, вы войдете без пароля
```

## Деплой проекта

### Вариант 1: Деплой на VPS/выделенный сервер

#### Шаг 1: Подготовка сервера

```bash
# Подключитесь к серверу
ssh user@your-server.com

# Установите Node.js (если не установлен)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Установите nginx (для обслуживания статических файлов)
sudo apt-get update
sudo apt-get install -y nginx

# Создайте директорию для проекта
sudo mkdir -p /var/www/academy-training
sudo chown $USER:$USER /var/www/academy-training
```

#### Шаг 2: Конфигурация Nginx

```bash
# Создайте конфигурационный файл nginx
sudo nano /etc/nginx/sites-available/academy-training

# Добавьте следующую конфигурацию:
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    root /var/www/academy-training;
    index index.html;

    # Gzip сжатие
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Кэширование статических файлов
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # HTML файлы не кэшируем
    location ~* \.html$ {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        add_header Pragma "no-cache";
        add_header Expires "0";
    }
}
```

```bash
# Активируйте конфигурацию
sudo ln -s /etc/nginx/sites-available/academy-training /etc/nginx/sites-enabled/

# Проверьте конфигурацию nginx
sudo nginx -t

# Перезапустите nginx
sudo systemctl restart nginx
```

#### Шаг 3: Настройка SSL (Let's Encrypt)

```bash
# Установите certbot
sudo apt-get install -y certbot python3-certbot-nginx

# Получите SSL сертификат
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot автоматически настроит nginx для HTTPS
```

#### Шаг 4: Деплой файлов

```bash
# На вашем локальном компьютере, создайте скрипт deploy.sh:
```

Создайте файл `deploy.sh` в корне проекта:

```bash
#!/bin/bash

# Параметры деплоя
SERVER_USER="your_username"
SERVER_HOST="your-server.com"
REMOTE_PATH="/var/www/academy-training"

echo "🚀 Начинаю деплой..."

# Собираем проект
echo "📦 Сборка проекта..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка при сборке проекта"
    exit 1
fi

# Копируем файлы на сервер
echo "📤 Загрузка файлов на сервер..."
rsync -avz --delete dist/ ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/

if [ $? -eq 0 ]; then
    echo "✅ Деплой завершен успешно!"
    echo "🌐 Сайт доступен по адресу: https://yourdomain.com"
else
    echo "❌ Ошибка при загрузке файлов"
    exit 1
fi
```

Сделайте скрипт исполняемым и запустите:

```bash
chmod +x deploy.sh
./deploy.sh
```

### Вариант 2: Деплой на Netlify (рекомендуется для статических сайтов)

```bash
# Установите Netlify CLI
npm install -g netlify-cli

# Войдите в аккаунт Netlify
netlify login

# Инициализируйте проект
netlify init

# Деплой проекта
netlify deploy --prod
```

### Вариант 3: Деплой на Vercel

```bash
# Установите Vercel CLI
npm install -g vercel

# Войдите в аккаунт Vercel
vercel login

# Деплой проекта
vercel --prod
```

## Автоматический деплой через GitHub Actions

Создайте файл `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Server

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Deploy to server
      uses: easingthemes/ssh-deploy@main
      env:
        SSH_PRIVATE_KEY: ${{ secrets.SSH_PRIVATE_KEY }}
        REMOTE_HOST: ${{ secrets.REMOTE_HOST }}
        REMOTE_USER: ${{ secrets.REMOTE_USER }}
        TARGET: /var/www/academy-training
        SOURCE: "dist/"
```

Добавьте секреты в настройках GitHub репозитория:
- `SSH_PRIVATE_KEY` - содержимое вашего приватного SSH ключа
- `REMOTE_HOST` - адрес вашего сервера
- `REMOTE_USER` - имя пользователя на сервере

## Обновление домена

После деплоя не забудьте:

1. Обновить URL в файлах:
   - `index.html` - замените `https://yourdomain.com/` на ваш реальный домен
   - `public/robots.txt` - обновите URL в Sitemap
   - `public/sitemap.xml` - замените все `yourdomain.com` на ваш домен

2. Настроить DNS записи для вашего домена:
   - A запись для @ и www, указывающая на IP вашего сервера

## Переменные окружения

Убедитесь, что файл `.env` НЕ попадает в публичную сборку (он в `.gitignore`).

Текущие переменные для продакшена:
```
VITE_SUPABASE_URL=https://ntrmbgelusszwhjgyjry.supabase.co
VITE_SUPABASE_ANON_KEY=[ваш ключ]
```

## Проверка после деплоя

1. Откройте сайт в браузере
2. Проверьте работу админ-панели (admin.html)
3. Проверьте отправку заявок
4. Проверьте видео-плеер
5. Проверьте мобильную версию
6. Проверьте SSL сертификат (зеленый замок в браузере)

## Мониторинг и обслуживание

### Просмотр логов Nginx

```bash
# Логи доступа
sudo tail -f /var/log/nginx/access.log

# Логи ошибок
sudo tail -f /var/log/nginx/error.log
```

### Обновление SSL сертификата

```bash
# Certbot автоматически обновляет сертификаты
# Проверка автообновления:
sudo certbot renew --dry-run
```

## Быстрый деплой

После первичной настройки, для быстрого деплоя просто запустите:

```bash
./deploy.sh
```

Или через npm (добавьте в package.json):

```json
{
  "scripts": {
    "deploy": "./deploy.sh"
  }
}
```

Тогда можно деплоить командой:

```bash
npm run deploy
```

## Откат изменений

Если что-то пошло не так, можете откатиться к предыдущей версии:

```bash
# На сервере сохраняйте бэкапы перед деплоем
ssh user@your-server.com "cp -r /var/www/academy-training /var/www/academy-training.backup"

# Для отката:
ssh user@your-server.com "rm -rf /var/www/academy-training && mv /var/www/academy-training.backup /var/www/academy-training"
```

## Контакты и поддержка

При возникновении проблем с деплоем:
- Проверьте логи сервера
- Убедитесь, что SSH ключ настроен правильно
- Проверьте права доступа к файлам на сервере
- Убедитесь, что все порты открыты (80, 443)
