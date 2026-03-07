# Makefile для "Лесная Команда"
# Упрощает команды для разработки и деплоя

.PHONY: help install dev build deploy check clean

# Цвета для вывода
BLUE := \033[0;34m
GREEN := \033[0;32m
NC := \033[0m

help: ## Показать эту справку
	@echo "$(BLUE)Доступные команды:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(GREEN)%-15s$(NC) %s\n", $$1, $$2}'

install: ## Установить все зависимости
	@echo "$(BLUE)Установка зависимостей...$(NC)"
	cd backend && pip install -r requirements.txt
	cd frontend && npm install
	@echo "$(GREEN)✓ Зависимости установлены$(NC)"

dev: ## Запустить локальную разработку
	@echo "$(BLUE)Запуск локальной разработки...$(NC)"
	docker-compose up -d postgres redis
	@echo "$(GREEN)✓ База данных и Redis запущены$(NC)"
	@echo "$(BLUE)Запустите в отдельных терминалах:$(NC)"
	@echo "  Backend:  cd backend && uvicorn app.main:app --reload"
	@echo "  Frontend: cd frontend && npm run dev"

dev-docker: ## Запустить все в Docker
	@echo "$(BLUE)Запуск в Docker...$(NC)"
	docker-compose up -d
	@echo "$(GREEN)✓ Все сервисы запущены$(NC)"
	@echo "  Frontend: http://localhost:3000"
	@echo "  Backend:  http://localhost:8000"
	@echo "  API Docs: http://localhost:8000/api/docs"

stop: ## Остановить Docker контейнеры
	@echo "$(BLUE)Остановка контейнеров...$(NC)"
	docker-compose down
	@echo "$(GREEN)✓ Контейнеры остановлены$(NC)"

logs: ## Показать логи Docker
	docker-compose logs -f

build: ## Собрать production билды
	@echo "$(BLUE)Сборка production билдов...$(NC)"
	cd frontend && npm run build
	@echo "$(GREEN)✓ Frontend собран$(NC)"

deploy: ## Задеплоить на production
	@echo "$(BLUE)Деплой на production...$(NC)"
	@if [ -f deploy.sh ]; then \
		chmod +x deploy.sh && ./deploy.sh; \
	else \
		git push origin main; \
		echo "$(GREEN)✓ Код запушен, автоматический деплой запущен$(NC)"; \
	fi

check: ## Проверить деплой
	@echo "$(BLUE)Проверка деплоя...$(NC)"
	@if [ -f check-deployment.sh ]; then \
		chmod +x check-deployment.sh && ./check-deployment.sh; \
	else \
		curl -s https://lesnayakomanda.onrender.com/api/ | grep -q "ok" && echo "$(GREEN)✓ Backend OK$(NC)" || echo "$(RED)✗ Backend FAIL$(NC)"; \
		curl -s -o /dev/null -w "%{http_code}" https://lesnaya-komanda.vercel.app | grep -q "200" && echo "$(GREEN)✓ Frontend OK$(NC)" || echo "$(RED)✗ Frontend FAIL$(NC)"; \
	fi

test: ## Запустить тесты
	@echo "$(BLUE)Запуск тестов...$(NC)"
	cd frontend && npm test
	@echo "$(GREEN)✓ Тесты пройдены$(NC)"

lint: ## Проверить код линтером
	@echo "$(BLUE)Проверка кода...$(NC)"
	cd frontend && npm run lint || true
	@echo "$(GREEN)✓ Проверка завершена$(NC)"

clean: ## Очистить временные файлы
	@echo "$(BLUE)Очистка...$(NC)"
	find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".pytest_cache" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
	find . -type d -name ".next" -exec rm -rf {} + 2>/dev/null || true
	docker-compose down -v
	@echo "$(GREEN)✓ Очистка завершена$(NC)"

db-migrate: ## Применить миграции БД
	@echo "$(BLUE)Применение миграций...$(NC)"
	cd backend && python apply_achievements_migration.py
	cd backend && python apply_events_migration.py
	cd backend && python apply_news_migration.py
	@echo "$(GREEN)✓ Миграции применены$(NC)"

db-seed: ## Заполнить БД тестовыми данными
	@echo "$(BLUE)Заполнение БД...$(NC)"
	cd backend && python seed_database.py
	@echo "$(GREEN)✓ БД заполнена$(NC)"

admin-create: ## Создать админа
	@echo "$(BLUE)Создание админа...$(NC)"
	cd backend && python create_admin.py
	@echo "$(GREEN)✓ Админ создан$(NC)"

status: ## Показать статус сервисов
	@echo "$(BLUE)Статус сервисов:$(NC)"
	@docker-compose ps

urls: ## Показать все URLs
	@echo "$(BLUE)URLs:$(NC)"
	@echo "  Local Frontend:  http://localhost:3000"
	@echo "  Local Backend:   http://localhost:8000"
	@echo "  Local API Docs:  http://localhost:8000/api/docs"
	@echo ""
	@echo "  Prod Frontend:   https://lesnaya-komanda.vercel.app"
	@echo "  Prod Backend:    https://lesnayakomanda.onrender.com"
	@echo "  Prod API Docs:   https://lesnayakomanda.onrender.com/api/docs"
	@echo "  Prod Admin:      https://lesnaya-komanda.vercel.app/admin"
