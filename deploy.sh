#!/bin/bash

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Параметры деплоя (ИЗМЕНИТЕ ЭТИ ЗНАЧЕНИЯ)
SERVER_USER="your_username"
SERVER_HOST="your-server.com"
REMOTE_PATH="/var/www/academy-training"

echo -e "${BLUE}🚀 Начинаю деплой Академии Научного Тренинга...${NC}"
echo ""

# Проверка наличия необходимых файлов
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Ошибка: package.json не найден. Запустите скрипт из корня проекта.${NC}"
    exit 1
fi

# Проверка наличия node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 Установка зависимостей...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Ошибка при установке зависимостей${NC}"
        exit 1
    fi
fi

# Сборка проекта
echo -e "${YELLOW}📦 Сборка проекта...${NC}"
npm run build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка при сборке проекта${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Проект успешно собран${NC}"
echo ""

# Проверка наличия dist
if [ ! -d "dist" ]; then
    echo -e "${RED}❌ Ошибка: папка dist не найдена${NC}"
    exit 1
fi

# Показываем размер сборки
DIST_SIZE=$(du -sh dist | cut -f1)
echo -e "${BLUE}📊 Размер сборки: ${DIST_SIZE}${NC}"
echo ""

# Проверка SSH подключения
echo -e "${YELLOW}🔐 Проверка SSH подключения...${NC}"
ssh -o BatchMode=yes -o ConnectTimeout=5 ${SERVER_USER}@${SERVER_HOST} "exit" 2>/dev/null

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Ошибка: Не удается подключиться к серверу${NC}"
    echo -e "${YELLOW}Проверьте параметры подключения:${NC}"
    echo -e "  Пользователь: ${SERVER_USER}"
    echo -e "  Хост: ${SERVER_HOST}"
    echo ""
    echo -e "${YELLOW}Убедитесь, что:${NC}"
    echo -e "  1. SSH ключ настроен правильно"
    echo -e "  2. Сервер доступен"
    echo -e "  3. Параметры SERVER_USER и SERVER_HOST в скрипте указаны верно"
    exit 1
fi

echo -e "${GREEN}✅ SSH подключение установлено${NC}"
echo ""

# Создание бэкапа на сервере
echo -e "${YELLOW}💾 Создание бэкапа текущей версии...${NC}"
BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
ssh ${SERVER_USER}@${SERVER_HOST} "if [ -d ${REMOTE_PATH} ]; then cp -r ${REMOTE_PATH} ${REMOTE_PATH}_${BACKUP_NAME}; echo 'Бэкап создан: ${REMOTE_PATH}_${BACKUP_NAME}'; else echo 'Бэкап не требуется (первый деплой)'; fi"

# Копирование файлов на сервер
echo -e "${YELLOW}📤 Загрузка файлов на сервер...${NC}"
echo ""

rsync -avz --delete \
  --exclude='.git' \
  --exclude='node_modules' \
  --exclude='.env' \
  --progress \
  dist/ ${SERVER_USER}@${SERVER_HOST}:${REMOTE_PATH}/

if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}✅ Деплой завершен успешно!${NC}"
    echo ""
    echo -e "${BLUE}📋 Информация о деплое:${NC}"
    echo -e "  🕒 Время: $(date '+%Y-%m-%d %H:%M:%S')"
    echo -e "  📦 Размер: ${DIST_SIZE}"
    echo -e "  🖥️  Сервер: ${SERVER_HOST}"
    echo -e "  📁 Путь: ${REMOTE_PATH}"
    echo ""
    echo -e "${GREEN}🌐 Сайт доступен по адресу: https://${SERVER_HOST}${NC}"
    echo -e "${GREEN}🔧 Админ-панель: https://${SERVER_HOST}/admin.html${NC}"
    echo ""
    echo -e "${YELLOW}💡 Совет: Очистите кэш браузера для просмотра обновлений${NC}"
else
    echo ""
    echo -e "${RED}❌ Ошибка при загрузке файлов${NC}"
    echo ""
    echo -e "${YELLOW}Для отката к предыдущей версии выполните:${NC}"
    echo -e "ssh ${SERVER_USER}@${SERVER_HOST} \"rm -rf ${REMOTE_PATH} && mv ${REMOTE_PATH}_${BACKUP_NAME} ${REMOTE_PATH}\""
    exit 1
fi
