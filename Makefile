.PHONY: dev down build migrate migration seed test-backend shell-db shell-backend

dev:
	docker compose up --build

down:
	docker compose down

build:
	docker compose build --no-cache

migrate:
	docker compose exec backend alembic upgrade head

migration:
	docker compose exec backend alembic revision --autogenerate -m "$(name)"

test-backend:
	docker compose exec backend pytest -v

shell-db:
	docker compose exec postgres psql -U wanteat -d wanteat_db

shell-backend:
	docker compose exec backend bash
