#!/bin/bash

# Deployment Script for Maxoy
# Usage: ./deploy.sh [staging|production]

set -e

ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

echo "================================"
echo "Maxoy Deployment Script"
echo "Environment: $ENVIRONMENT"
echo "================================"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Please copy .env.production.example to .env.production and configure it"
    exit 1
fi

# Load environment variables
set -a
source .env.production
set +a

echo -e "${YELLOW}Step 1: Pulling latest changes...${NC}"
git pull origin main

echo -e "${YELLOW}Step 2: Pulling Docker images...${NC}"
docker compose -f $COMPOSE_FILE pull

echo -e "${YELLOW}Step 3: Building application...${NC}"
docker compose -f $COMPOSE_FILE build --no-cache app

echo -e "${YELLOW}Step 4: Stopping old containers...${NC}"
docker compose -f $COMPOSE_FILE down

echo -e "${YELLOW}Step 5: Starting services...${NC}"
docker compose -f $COMPOSE_FILE up -d

echo -e "${YELLOW}Step 6: Waiting for database...${NC}"
sleep 10

echo -e "${YELLOW}Step 7: Running database migrations...${NC}"
docker compose -f $COMPOSE_FILE exec -T app npx prisma migrate deploy

echo -e "${YELLOW}Step 8: Health check...${NC}"
sleep 5

if curl -f http://localhost:${APP_PORT:-3000}/admin/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Application is healthy${NC}"
else
    echo -e "${RED}✗ Health check failed${NC}"
    echo "Check logs with: docker compose -f $COMPOSE_FILE logs app"
    exit 1
fi

echo -e "${YELLOW}Step 9: Cleaning up...${NC}"
docker system prune -f

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "View logs: docker compose -f $COMPOSE_FILE logs -f app"
echo "Stop: docker compose -f $COMPOSE_FILE down"
echo "Restart: docker compose -f $COMPOSE_FILE restart app"
