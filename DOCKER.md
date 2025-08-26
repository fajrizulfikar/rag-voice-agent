# Docker Development Environment

This document provides comprehensive instructions for setting up and using the Docker-based development environment for the Voice-Powered RAG FAQ Agent.

## Prerequisites

- Docker Desktop (v20.10+)
- Docker Compose (v2.0+)
- At least 4GB of available RAM
- 10GB of free disk space

## Architecture Overview

The Docker environment consists of the following services:

- **PostgreSQL**: Primary database for application data
- **Qdrant**: Vector database for semantic search
- **Redis**: Caching and session management
- **Backend**: NestJS API server
- **Frontend**: Next.js web application
- **pgAdmin**: Database management tool (optional)
- **Nginx**: Reverse proxy (production only)

## Quick Start

### 1. Environment Setup

Copy the example environment file and configure it:

```bash
# Copy environment template
cp .env.example .env.development

# Edit the development environment file
# Add your API keys (OpenAI, Google Cloud) if available
nano .env.development
```

### 2. Start Development Environment

```bash
# Start all services in development mode
docker-compose up -d

# View logs from all services
docker-compose logs -f

# View logs from specific service
docker-compose logs -f backend
```

### 3. Access Services

- **Frontend**: http://localhost:3001
- **Backend API**: http://localhost:3000
- **Backend Health Check**: http://localhost:3000/health
- **Qdrant Dashboard**: http://localhost:6333/dashboard
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379

### 4. Database Setup

The database will be automatically created and synchronized on first run in development mode.

To manually run migrations:

```bash
# Enter the backend container
docker-compose exec backend bash

# Run migrations
npm run migration:run

# Generate new migration (after entity changes)
npm run migration:generate -- src/migrations/YourMigrationName
```

## Development Workflow

### Starting Services

```bash
# Start all services
docker-compose up -d

# Start specific services
docker-compose up -d postgres qdrant redis
docker-compose up backend frontend

# Start with build (after code changes)
docker-compose up --build
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ destroys data)
docker-compose down -v

# Stop specific services
docker-compose stop backend frontend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Recent logs only
docker-compose logs --tail=100 -f backend
```

### Executing Commands

```bash
# Backend container commands
docker-compose exec backend bash
docker-compose exec backend npm run test
docker-compose exec backend npm run lint

# Frontend container commands
docker-compose exec frontend bash
docker-compose exec frontend npm run build

# Database commands
docker-compose exec postgres psql -U postgres -d rag_voice_db
```

### File Watching and Hot Reload

Both backend and frontend services support hot reloading:

- **Backend**: Uses `nest start --watch` for automatic restarts
- **Frontend**: Uses Next.js Turbopack for fast refresh
- **Volumes**: Source code is mounted for live development

## Database Management

### Using pgAdmin (Optional)

Start pgAdmin with the admin-tools profile:

```bash
# Start pgAdmin
docker-compose --profile admin-tools up -d pgadmin

# Access pgAdmin
# URL: http://localhost:5050
# Email: admin@example.com
# Password: admin
```

### Direct Database Access

```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d rag_voice_db

# Common database commands
\dt                 # List tables
\d documents        # Describe documents table
SELECT COUNT(*) FROM documents;
```

### Backup and Restore

```bash
# Create backup
docker-compose exec postgres pg_dump -U postgres rag_voice_db > backup.sql

# Restore backup
docker-compose exec -T postgres psql -U postgres rag_voice_db < backup.sql
```

## Vector Database (Qdrant)

### Dashboard Access

Visit http://localhost:6333/dashboard to access the Qdrant web UI.

### API Testing

```bash
# Check Qdrant health
curl http://localhost:6333/health

# List collections
curl http://localhost:6333/collections

# Create collection (done automatically by application)
curl -X PUT http://localhost:6333/collections/faq_documents \
  -H "Content-Type: application/json" \
  -d '{"vectors": {"size": 1536, "distance": "Cosine"}}'
```

## Production Deployment

### 1. Production Environment

```bash
# Copy and configure production environment
cp .env.example .env.production
nano .env.production

# Set secure values for:
# - JWT_SECRET
# - POSTGRES_PASSWORD
# - API keys
```

### 2. Production Build

```bash
# Build and start production services
docker-compose -f docker-compose.prod.yml up --build -d

# View production logs
docker-compose -f docker-compose.prod.yml logs -f
```

### 3. SSL Configuration

For HTTPS in production:

1. Place SSL certificates in `./ssl/` directory
2. Update `nginx.conf` with your domain
3. Uncomment SSL server block
4. Restart nginx service

## Troubleshooting

### Common Issues

#### Database Connection Issues

```bash
# Check database health
docker-compose exec postgres pg_isready -U postgres

# Restart database service
docker-compose restart postgres

# Check database logs
docker-compose logs postgres
```

#### Backend Won't Start

```bash
# Check backend logs
docker-compose logs backend

# Rebuild backend image
docker-compose build backend

# Clear node_modules and rebuild
docker-compose down
docker volume prune
docker-compose up --build
```

#### Frontend Build Issues

```bash
# Clear Next.js cache
docker-compose exec frontend rm -rf .next
docker-compose restart frontend

# Rebuild frontend
docker-compose build frontend
```

#### Port Conflicts

If ports are already in use:

```bash
# Check what's using the ports
netstat -tulpn | grep :3000
lsof -i :3000

# Stop conflicting services or modify docker-compose.yml ports
```

### Performance Optimization

#### Memory Issues

```bash
# Monitor resource usage
docker stats

# Increase Docker Desktop memory limit
# Docker Desktop → Settings → Resources → Memory
```

#### Disk Space

```bash
# Clean up unused Docker resources
docker system prune -a

# Remove unused volumes
docker volume prune

# Check disk usage
docker system df
```

## Environment Variables Reference

### Required for Development

- `OPENAI_API_KEY`: OpenAI API key for embeddings and chat
- `GOOGLE_CLOUD_PROJECT_ID`: GCP project ID (for speech services)
- `GOOGLE_APPLICATION_CREDENTIALS`: Path to GCP service account key

### Optional Configuration

- `QDRANT_API_KEY`: Qdrant API key (for cloud deployment)
- `REDIS_PASSWORD`: Redis password (for production)
- `JWT_SECRET`: Custom JWT secret (recommended for production)

### Database URL Formats

```bash
# PostgreSQL URL format
DATABASE_URL=postgresql://username:password@host:port/database

# Redis URL format
REDIS_URL=redis://[:password@]host:port[/db]
```

## Monitoring and Health Checks

### Health Check Endpoints

- Backend: `GET /health`
- Database: `SELECT 1` query
- Qdrant: `GET /health`
- Redis: `PING` command

### Service Status

```bash
# Check all service health
docker-compose ps

# Check specific service
docker-compose exec backend curl -f http://localhost:3000/health
```

## Development Tips

1. **Use volumes for faster development**: Source code is automatically synced
2. **Enable hot reloading**: Both services support live code changes
3. **Use separate terminals**: Run logs in one terminal, commands in another
4. **Backup important data**: Use database dumps before major changes
5. **Monitor resources**: Keep an eye on Docker resource usage

For additional help, refer to the main README or create an issue in the project repository.