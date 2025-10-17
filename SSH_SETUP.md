# Настройка SSH сертификата для деплоя

## Быстрый старт

### 1. Генерация SSH ключа

Откройте терминал на вашем компьютере и выполните:

```bash
# Создайте новый SSH ключ с алгоритмом ed25519 (рекомендуется)
ssh-keygen -t ed25519 -C "academy-training-deploy"

# При запросе введите путь для сохранения (нажмите Enter для значения по умолчанию):
# ~/.ssh/id_ed25519

# При запросе пароля можете нажать Enter (без пароля) или установить пароль для дополнительной безопасности
```

**Альтернатива для старых систем:**

```bash
# Если ed25519 не поддерживается, используйте RSA
ssh-keygen -t rsa -b 4096 -C "academy-training-deploy"
```

### 2. Просмотр публичного ключа

```bash
# Для ed25519
cat ~/.ssh/id_ed25519.pub

# Для RSA
cat ~/.ssh/id_rsa.pub
```

Скопируйте весь вывод команды (начинается с `ssh-ed25519` или `ssh-rsa`).

### 3. Добавление ключа на сервер

#### Способ 1: Автоматический (рекомендуется)

```bash
# Замените user и your-server.com на ваши данные
ssh-copy-id user@your-server.com

# Введите пароль сервера при запросе
```

#### Способ 2: Ручной

1. Подключитесь к серверу:
```bash
ssh user@your-server.com
```

2. Создайте директорию для SSH ключей (если не существует):
```bash
mkdir -p ~/.ssh
chmod 700 ~/.ssh
```

3. Добавьте публичный ключ:
```bash
nano ~/.ssh/authorized_keys
# Вставьте скопированный публичный ключ
# Сохраните: Ctrl+X, затем Y, затем Enter
```

4. Установите правильные права:
```bash
chmod 600 ~/.ssh/authorized_keys
```

5. Выйдите с сервера:
```bash
exit
```

### 4. Проверка подключения

```bash
# Попробуйте подключиться без пароля
ssh user@your-server.com

# Если все настроено правильно, вы войдете без запроса пароля
```

## Настройка деплоя

### 1. Обновите файл deploy.sh

Откройте файл `deploy.sh` и измените параметры:

```bash
SERVER_USER="ваш_пользователь"  # например: root, admin, ubuntu
SERVER_HOST="your-server.com"    # IP или домен вашего сервера
REMOTE_PATH="/var/www/academy-training"  # путь на сервере
```

### 2. Создайте директорию на сервере

```bash
# Подключитесь к серверу
ssh user@your-server.com

# Создайте директорию для проекта
sudo mkdir -p /var/www/academy-training

# Дайте права вашему пользователю
sudo chown $USER:$USER /var/www/academy-training

# Выйдите
exit
```

### 3. Запустите деплой

```bash
# В корне проекта выполните
./deploy.sh
```

## Автоматический деплой через GitHub Actions

### 1. Добавьте секреты в GitHub

1. Откройте ваш репозиторий на GitHub
2. Перейдите в **Settings** → **Secrets and variables** → **Actions**
3. Нажмите **New repository secret** и добавьте:

#### SSH_PRIVATE_KEY

```bash
# Скопируйте содержимое приватного ключа
cat ~/.ssh/id_ed25519
# или
cat ~/.ssh/id_rsa

# Скопируйте ВСЁ содержимое (включая BEGIN и END строки)
```

Вставьте в GitHub как секрет `SSH_PRIVATE_KEY`.

#### REMOTE_HOST

Ваш домен или IP сервера, например:
```
example.com
```

#### REMOTE_USER

Имя пользователя на сервере, например:
```
root
```

#### REMOTE_PATH

Путь к директории на сервере, например:
```
/var/www/academy-training
```

#### VITE_SUPABASE_URL

```
https://ntrmbgelusszwhjgyjry.supabase.co
```

#### VITE_SUPABASE_ANON_KEY

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im50cm1iZ2VsdXNzendoamd5anJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA2MTY0OTIsImV4cCI6MjA3NjE5MjQ5Mn0.OsUZmqRzbItZQnA9-FHVmS7-sRJpl1HVcS-PZZfspFA
```

### 2. Проверка работы

После добавления секретов:

1. Сделайте коммит и пуш в ветку `main` или `master`
2. Откройте вкладку **Actions** в вашем репозитории
3. Наблюдайте за процессом деплоя

## Устранение проблем

### Ошибка: Permission denied (publickey)

**Проблема:** SSH ключ не найден или не добавлен на сервер.

**Решение:**
```bash
# Проверьте наличие ключа
ls -la ~/.ssh/

# Убедитесь, что публичный ключ добавлен на сервер
ssh-copy-id user@your-server.com
```

### Ошибка: Host key verification failed

**Проблема:** Сервер не в списке известных хостов.

**Решение:**
```bash
# Добавьте сервер в известные хосты
ssh-keyscan -H your-server.com >> ~/.ssh/known_hosts
```

### Ошибка: rsync: command not found

**Проблема:** rsync не установлен на сервере.

**Решение:**
```bash
# На сервере установите rsync
ssh user@your-server.com

# Ubuntu/Debian
sudo apt-get install rsync

# CentOS/RHEL
sudo yum install rsync
```

### Проверка прав доступа

```bash
# Права для SSH директории
chmod 700 ~/.ssh

# Права для приватного ключа
chmod 600 ~/.ssh/id_ed25519

# Права для публичного ключа
chmod 644 ~/.ssh/id_ed25519.pub

# На сервере - права для authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Безопасность

### Рекомендации

1. **Используйте пароль для SSH ключа** при создании (опционально, но рекомендуется)

2. **Отключите вход по паролю на сервере:**

```bash
# Откройте конфигурацию SSH
sudo nano /etc/ssh/sshd_config

# Найдите и измените:
PasswordAuthentication no
PubkeyAuthentication yes

# Перезапустите SSH
sudo systemctl restart sshd
```

3. **Используйте SSH-агент** для управления ключами:

```bash
# Запустите SSH-агент
eval "$(ssh-agent -s)"

# Добавьте ключ
ssh-add ~/.ssh/id_ed25519
```

4. **Регулярно обновляйте ключи** (раз в год или при компрометации)

### Ограничение доступа

Создайте отдельного пользователя для деплоя:

```bash
# На сервере создайте пользователя
sudo useradd -m -s /bin/bash deployer

# Добавьте в группу www-data (для nginx/apache)
sudo usermod -a -G www-data deployer

# Настройте права
sudo chown -R deployer:www-data /var/www/academy-training

# Добавьте SSH ключ для этого пользователя
sudo su - deployer
mkdir -p ~/.ssh
nano ~/.ssh/authorized_keys
# Вставьте публичный ключ
chmod 600 ~/.ssh/authorized_keys
exit
```

## Полезные команды

```bash
# Проверка SSH подключения с подробным выводом
ssh -v user@your-server.com

# Тестирование деплоя без фактического копирования
rsync -avzn --delete dist/ user@your-server.com:/var/www/academy-training/

# Просмотр активных SSH соединений
who

# Просмотр логов SSH на сервере
sudo tail -f /var/log/auth.log

# Перезагрузка SSH сервиса
sudo systemctl restart sshd
```

## Дополнительная информация

Для более подробной информации о деплое смотрите файл `DEPLOYMENT.md`.
