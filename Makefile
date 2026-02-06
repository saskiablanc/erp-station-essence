# Makefile pour le projet Station-Service
# Usage: make <target>

.PHONY: help start stop reset install test clean migrations

# Cible par défaut
.DEFAULT_GOAL := help

help: ## Affiche cette aide
	@echo "Projet Station-Service - Commandes disponibles:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'
	@echo ""

install: ## Installation de l'environnement
	@echo "Installation..."
	@if [ ! -d "venv" ]; then python3 -m venv venv; fi
	@. venv/bin/activate && pip install --upgrade pip
	@. venv/bin/activate && pip install -r requirements.txt
	@if [ ! -f ".env" ]; then cp .env.example .env; fi
	@echo "Installation terminée"

start: ## Démarre tous les services
	@echo "Démarrage..."
	@docker-compose up -d
	@sleep 3
	@. venv/bin/activate && alembic upgrade head
	@echo "Projet démarré"
	@echo "phpMyAdmin: http://localhost:8080"

start-quick: ## Démarre sans migrations
	@echo "⚡ Démarrage rapide..."
	@docker-compose up -d
	@echo "Docker démarré"

stop: ## Arrête tous les services
	@echo "Arrêt..."
	@docker-compose down
	@echo "Services arrêtés"

reset: ## Réinitialise tout (supprime les données)
	@echo "Réinitialisation..."
	@docker-compose down -v
	@echo "Réinitialisation terminée"

docker-up: ## Démarre Docker uniquement
	@docker-compose up -d

docker-down: ## Arrête Docker
	@docker-compose down

docker-logs: ## Affiche les logs Docker
	@docker-compose logs -f

migrations-create: ## Crée une migration (usage: make migrations-create m="description")
	@if [ -z "$(m)" ]; then \
		echo "Usage: make migrations-create m='Description'"; \
		exit 1; \
	fi
	@. venv/bin/activate && alembic revision --autogenerate -m "$(m)"
	@echo "Migration créée"

migrations-apply: ## Applique les migrations
	@. venv/bin/activate && alembic upgrade head
	@echo "Migrations appliquées"

migrations-rollback: ## Annule la dernière migration
	@. venv/bin/activate && alembic downgrade -1
	@echo "Rollback effectué"

migrations-history: ## Affiche l'historique des migrations
	@. venv/bin/activate && alembic history

test: ## Exécute les tests
	@. venv/bin/activate && pytest tests/ -v

test-quick: ## Exécute les tests en mode rapide
	@. venv/bin/activate && pytest tests/ -q

clean: ## Nettoie les fichiers temporaires
	@find . -type d -name "__pycache__" -exec rm -rf {} + 2>/dev/null || true
	@find . -type f -name "*.pyc" -delete
	@find . -type f -name "*.pyo" -delete
	@rm -rf .pytest_cache htmlcov .coverage
	@echo "Nettoyage terminé"

db-shell: ## Ouvre MySQL (base courante)
	@docker exec -it station_db_courante mysql -ustation_user -pstation_pass_secure StationCourante

db-shell-archive: ## Ouvre MySQL (base archive)
	@docker exec -it station_db_archive mysql -ustation_user -pstation_pass_secure Archive

phpmyadmin: ## Ouvre phpMyAdmin
	@open http://localhost:8080 || xdg-open http://localhost:8080 || echo "Ouvrez: http://localhost:8080"

dev: install docker-up migrations-apply ## Setup complet pour nouveau dev
	@echo "Environnement prêt !"
