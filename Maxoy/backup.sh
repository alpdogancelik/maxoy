# Backup Script for Maxoy Database
# Usage: ./backup.sh

set -e

BACKUP_DIR="./backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/maxoy_backup_$TIMESTAMP.sql"
COMPOSE_FILE="docker-compose.prod.yml"

# Color codes
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${YELLOW}Creating backup directory...${NC}"
mkdir -p $BACKUP_DIR

echo -e "${YELLOW}Creating database backup...${NC}"
docker compose -f $COMPOSE_FILE exec -T db pg_dump -U maxoy maxoy > $BACKUP_FILE

echo -e "${YELLOW}Compressing backup...${NC}"
gzip $BACKUP_FILE

echo -e "${GREEN}Backup completed: ${BACKUP_FILE}.gz${NC}"

# Keep only last 7 backups
echo -e "${YELLOW}Cleaning old backups...${NC}"
cd $BACKUP_DIR
ls -t maxoy_backup_*.sql.gz | tail -n +8 | xargs -r rm --

echo -e "${GREEN}Backup process finished${NC}"
