#!/bin/bash
set -e

echo "🚆 RailBlock Backend starting..."
echo "📡 Database: ${DB_HOST:-postgres}:${DB_PORT:-5432}/${DB_NAME:-railblock}"

# ── Run Alembic migrations ───────────────────────────
# Docker Compose 'depends_on: condition: service_healthy' ensures
# PostgreSQL is already up and accepting connections by this point.
echo "📦 Running database migrations..."
python -m alembic upgrade head
echo "✅ Migrations complete!"

# ── Start uvicorn ────────────────────────────────────
echo "🚀 Starting FastAPI server on port ${BACKEND_PORT:-8000}..."
exec uvicorn app.main:app \
    --host 0.0.0.0 \
    --port "${BACKEND_PORT:-8000}" \
    --workers "${WORKERS:-1}" \
    --log-level "${LOG_LEVEL:-info}"
