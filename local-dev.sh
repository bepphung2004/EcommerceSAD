#!/usr/bin/env bash
set -euo pipefail

COMPOSE_FILE="infrastructure/docker-compose.yml"
ENV_FILE=".env"
NGINX_PORT="${NGINX_PORT:-80}"

ensure_env() {
  if [[ ! -f ".env" ]]; then
    cp .env.example .env
    echo "Created .env from .env.example"
  fi
}

wait_gateway() {
  echo "Waiting for backend services to be fully initialized..."
  for i in {1..90}; do
    STATUS_PROD=$(curl -o /dev/null -s -w "%{http_code}" "http://localhost:${NGINX_PORT}/api/products/")
    STATUS_USER=$(curl -o /dev/null -s -w "%{http_code}" "http://localhost:${NGINX_PORT}/api/users/")
    
    if [ "$STATUS_PROD" -eq 200 ] && { [ "$STATUS_USER" -eq 401 ] || [ "$STATUS_USER" -eq 403 ]; }; then
      echo "All database migrations completed and services are ready."
      return 0
    fi
    echo "Waiting for databases and migrations ($i/90)..."
    sleep 2
  done
  echo "Services readiness check timed out."
  return 1
}

seed_data() {
  echo "Seeding user-service..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T user-service python manage.py seed_data --skip-checks

  echo "Seeding product-service..."
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" exec -T product-service python manage.py seed_data --skip-checks

  echo "Seed completed."
  echo "Test users:"
  echo "- admin / admin123"
  echo "- staff / staff123"
  echo "- customer / customer123"
}

up_all() {
  ensure_env
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up --build -d
  wait_gateway
  seed_data
  echo "System is ready:"
  echo "- Nginx entrypoint (UI + API): http://localhost"
  echo "- Frontend direct dev port: http://localhost:3000"
  echo "- Gateway direct API: http://localhost:8080"
}

show_help() {
  echo "Usage: ./local-dev.sh [up|seed|down|logs|ps|restart]"
}

ACTION="${1:-up}"

case "$ACTION" in
  up)
    up_all
    ;;
  seed)
    seed_data
    ;;
  down)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
    ;;
  logs)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" logs -f
    ;;
  ps)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps
    ;;
  restart)
    docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" down
    up_all
    ;;
  *)
    show_help
    exit 1
    ;;
esac
