#!/bin/bash
# Server-side deploy script called by GitHub Actions
# Location: scripts/deploy.sh

set -e

GIT_DIR="/var/www/yq"
APP_DIR="/var/www/yq/YQ Management"

echo "====> Syncing latest code with origin/main..."
cd "$GIT_DIR"

git fetch origin main
if [ -n "$(git status --porcelain)" ]; then
    echo "Notice: Local modifications or untracked files detected in $GIT_DIR."
    echo "Stashing changes safely before syncing to origin/main..."
    git stash -u -m "deploy_auto_stash_$(date +%Y%m%d_%H%M%S)" || true
fi
git reset --hard origin/main
git clean -fd -e ".env" -e "YQ Management/.env"

cd "$APP_DIR"

echo "====> Validating .env file..."
if [ ! -f .env ]; then
    echo "ERROR: .env file missing in $APP_DIR! Deployment aborted."
    exit 1
fi

echo "====> Preparing shared dependencies for Docker builds..."
cp -r "./shared" "./frontend/shared"
sed -i 's|"@yq/shared": "\*"|"@yq/shared": "file:./shared"|g' "./frontend/package.json"
cp -r "./shared" "./backend/shared"
sed -i 's|"@yq/shared": "\*"|"@yq/shared": "file:./shared"|g' "./backend/package.json"

echo "====> Building Backend Docker image..."
docker build -t ghcr.io/yqglobal/yq-management-backend:latest ./backend

echo "====> Building Frontend Docker image..."
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.qmova.yqbuddy.com \
  --build-arg NEXT_PUBLIC_BACKEND_URL=https://api.qmova.yqbuddy.com \
  --build-arg NEXT_PUBLIC_WS_URL=https://api.qmova.yqbuddy.com \
  --build-arg NEXT_PUBLIC_APP_URL=https://qmova.yqbuddy.com \
  --build-arg NEXT_PUBLIC_DOMAIN_BASE=qmova.yqbuddy.com \
  --build-arg NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_51TncmkIdVVmQLEG3kmpaJE7ROAPd9XcW94BzXuJoLlEjuGCMVflLVSw3chR4GL3IlI9Wnq2WkQKtkVrhxGRSB8mA00G5T3CIYn \
  -t ghcr.io/yqglobal/yq-management-frontend:latest ./frontend

git checkout -- frontend/package.json backend/package.json
rm -rf frontend/shared backend/shared

echo "====> Running Safe Database Migrations..."
# Clear any failed migrations that might block the pipeline
docker exec yq-postgres psql -U postgres -d yq_queue -c "DELETE FROM _prisma_migrations WHERE finished_at IS NULL;" || true
docker compose -f docker-compose.production.yml run --rm backend npx prisma migrate deploy

echo "====> Seeding/Updating Industry Blueprints..."
docker compose -f docker-compose.production.yml run --rm backend node dist/service-flow/seed-blueprints.js

echo "====> Starting new containers..."
# Recreate only the containers that have changed images or configs
docker compose -f docker-compose.production.yml up -d --remove-orphans --wait

# Clean up dangling images to save disk space
docker image prune -f || true

echo "====> Deployment Complete!"
