# Deployment Guide

This guide covers deploying the Maxoy e-commerce application to production.

## Prerequisites

- Docker and Docker Compose installed on the server
- Domain name configured with DNS pointing to your server
- SSL certificate (recommended: Let's Encrypt with Certbot)
- GitHub account for CI/CD (optional)

## Architecture

The production stack consists of:
- **Next.js App**: Main application server
- **PostgreSQL**: Database
- **Nginx**: Reverse proxy with rate limiting and caching

## Quick Start (Manual Deployment)

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin -y

# Create application directory
sudo mkdir -p /opt/maxoy
sudo chown $USER:$USER /opt/maxoy
cd /opt/maxoy
```

### 2. Clone Repository

```bash
git clone https://github.com/yourorg/maxoy.git .
cd Maxoy
```

### 3. Configure Environment

```bash
# Copy production environment template
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

**Important**: Update these values:
- `POSTGRES_PASSWORD`: Strong database password
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: Admin credentials
- `DATABASE_URL`: Update with your postgres password
- S3 credentials if using cloud storage
- Domain names in nginx.conf

### 4. Build and Start Services

```bash
# Build the application
docker compose -f docker-compose.prod.yml build

# Start all services
docker compose -f docker-compose.prod.yml up -d

# Run database migrations
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy

# Seed initial data (optional)
docker compose -f docker-compose.prod.yml exec app npx prisma db seed
```

### 5. Verify Deployment

```bash
# Check running containers
docker ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f app

# Health check
curl http://localhost/admin/health
```

## SSL/HTTPS Setup

### Using Certbot (Let's Encrypt)

```bash
# Install certbot
sudo apt install certbot python3-certbot-nginx -y

# Stop nginx container temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Obtain certificate
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Copy certificates
sudo mkdir -p ./ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem ./ssl/cert.pem
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem ./ssl/key.pem
sudo chown $USER:$USER ./ssl/*

# Update nginx.conf to enable HTTPS server block
nano nginx.conf  # Uncomment HTTPS section

# Restart nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

### Certificate Auto-Renewal

```bash
# Add renewal cron job
sudo crontab -e

# Add this line:
0 0 * * * certbot renew --quiet --deploy-hook "cd /opt/maxoy/Maxoy && docker compose -f docker-compose.prod.yml restart nginx"
```

## CI/CD with GitHub Actions

### 1. GitHub Secrets Setup

Configure these secrets in your GitHub repository (Settings → Secrets and variables → Actions):

**For Staging:**
- `STAGING_HOST`: Server IP or hostname
- `STAGING_USER`: SSH username
- `STAGING_SSH_KEY`: Private SSH key

**For Production:**
- `PRODUCTION_HOST`: Server IP or hostname
- `PRODUCTION_USER`: SSH username
- `PRODUCTION_SSH_KEY`: Private SSH key

### 2. Server SSH Setup

```bash
# On your local machine, generate SSH key if needed
ssh-keygen -t ed25519 -C "github-actions"

# Copy public key to server
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@your-server

# Add private key to GitHub Secrets
cat ~/.ssh/id_ed25519  # Copy this to PRODUCTION_SSH_KEY secret
```

### 3. Workflow Configuration

The CI/CD pipeline automatically:
- Runs on push to `main` (production) or `develop` (staging)
- Lints code and runs type checks
- Builds and pushes Docker image to GitHub Container Registry
- Deploys to appropriate environment
- Runs database migrations
- Performs health checks

### 4. Branch Strategy

- `main`: Production environment (auto-deploy)
- `develop`: Staging environment (auto-deploy)
- Feature branches: CI checks only (no deployment)

## Monitoring and Maintenance

### View Logs

```bash
# All services
docker compose -f docker-compose.prod.yml logs -f

# Specific service
docker compose -f docker-compose.prod.yml logs -f app

# Last 100 lines
docker compose -f docker-compose.prod.yml logs --tail=100 app
```

### Database Backup

```bash
# Create backup
docker compose -f docker-compose.prod.yml exec db pg_dump -U maxoy maxoy > backup_$(date +%Y%m%d).sql

# Restore backup
cat backup_20260206.sql | docker compose -f docker-compose.prod.yml exec -T db psql -U maxoy maxoy
```

### Updates and Rollbacks

```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml up -d --build

# Rollback to previous version
docker compose -f docker-compose.prod.yml down
git checkout <previous-commit>
docker compose -f docker-compose.prod.yml up -d --build
```

### Health Monitoring

```bash
# Container health
docker compose -f docker-compose.prod.yml ps

# System resources
docker stats

# Disk usage
docker system df
```

### Cleanup

```bash
# Remove unused images
docker image prune -a

# Remove unused volumes (CAREFUL!)
docker volume prune

# Complete cleanup
docker system prune -af --volumes
```

## Scaling Considerations

### Horizontal Scaling

To run multiple app instances behind nginx:

```yaml
# In docker-compose.prod.yml
services:
  app:
    deploy:
      replicas: 3
    # ... rest of config
```

### Database Performance

For high traffic:
- Consider managed PostgreSQL (AWS RDS, DigitalOcean, etc.)
- Update `DATABASE_URL` to point to external database
- Remove `db` service from docker-compose.prod.yml

### CDN Integration

For static assets and images:
- Use Cloudflare or CloudFront
- Configure in `next.config.js`
- Update `NEXT_PUBLIC_MEDIA_BASE_URL`

## Troubleshooting

### Container won't start

```bash
# Check logs
docker compose -f docker-compose.prod.yml logs app

# Check environment variables
docker compose -f docker-compose.prod.yml config

# Verify database connection
docker compose -f docker-compose.prod.yml exec app npx prisma db pull
```

### Database connection issues

```bash
# Check database status
docker compose -f docker-compose.prod.yml exec db pg_isready -U maxoy

# Reset database (CAUTION: data loss)
docker compose -f docker-compose.prod.yml down -v
docker compose -f docker-compose.prod.yml up -d
docker compose -f docker-compose.prod.yml exec app npx prisma migrate deploy
```

### High memory usage

```bash
# Set memory limits in docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (UFW or firewalld)
- [ ] Set up regular backups
- [ ] Enable Docker security scanning
- [ ] Keep Docker and system packages updated
- [ ] Review nginx rate limiting rules
- [ ] Disable SSH password authentication
- [ ] Set up monitoring and alerting

## Support

For issues or questions:
- Check logs first: `docker compose -f docker-compose.prod.yml logs`
- Review [Next.js documentation](https://nextjs.org/docs)
- Review [Prisma documentation](https://www.prisma.io/docs)

