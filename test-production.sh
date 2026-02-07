#!/bin/bash
# Test Production Build Locally
# Usage: ./test-production.sh [--clean]

set -e

CLEAN=false
if [ "$1" = "--clean" ]; then
    CLEAN=true
fi

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}================================${NC}"
echo -e "${CYAN}Testing Production Build${NC}"
echo -e "${CYAN}================================${NC}"

if [ "$CLEAN" = true ]; then
    echo -e "${YELLOW}Cleaning previous build...${NC}"
    docker compose -f docker-compose.prod.yml down -v
    docker rmi maxoy:test 2>/dev/null || true
fi

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${YELLOW}Creating .env.production from example...${NC}"
    cp .env.production.example .env.production
    echo -e "${RED}Please edit .env.production with your settings${NC}"
    exit 1
fi

echo -e "${YELLOW}Building production Docker image...${NC}"
docker build -t maxoy:test -f Dockerfile .

echo -e "${YELLOW}Starting services...${NC}"
export IMAGE_TAG=test
docker compose -f docker-compose.prod.yml up -d

echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 15

echo -e "${YELLOW}Running database migrations...${NC}"
docker compose -f docker-compose.prod.yml exec -T app npx prisma migrate deploy

echo -e "${YELLOW}Seeding database (optional)...${NC}"
docker compose -f docker-compose.prod.yml exec -T app npx prisma db seed || true

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}Production build is running!${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo -e "${CYAN}Access the application at:${NC}"
echo -e "  Admin: http://localhost/admin/login"
echo -e "  Health: http://localhost/admin/health"
echo ""
echo -e "${CYAN}Useful commands:${NC}"
echo -e "  View logs: docker compose -f docker-compose.prod.yml logs -f app"
echo -e "  Stop: docker compose -f docker-compose.prod.yml down"
echo -e "  Cleanup: docker compose -f docker-compose.prod.yml down -v"
