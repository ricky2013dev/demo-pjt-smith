# Docker Setup Guide

## Overview

This project uses Docker for **local development only**. The development server uses a remote database (Neon, Supabase, etc.).

## Environment Modes

### Local Development (with Docker)
- **NODE_ENV**: `local_development`
- **Database**: Docker PostgreSQL (localhost:5432)
- **Command**: `npm run dev:local`

### Development Server (without Docker)
- **NODE_ENV**: `development`
- **Database**: Remote database (Neon, Supabase, etc.)
- **Command**: `npm run dev`

## Quick Start

### Local Development

1. **Start Docker and Server**:
   ```bash
   npm run dev:local
   ```
   This will:
   - Start Docker PostgreSQL container
   - Wait for database to be ready
   - Start the application server

2. **Clean Restart** (stops Docker first):
   ```bash
   npm run dev:clean
   ```

3. **Stop Docker**:
   ```bash
   npm run docker:down
   ```

### Development Server Deployment

1. Update `.env.local` with remote database credentials:
   ```bash
   cp .env.development.example .env.local
   # Edit .env.local with your remote database URL
   ```

2. Set `NODE_ENV=development` in `.env.local`

3. Start server (without Docker):
   ```bash
   npm run dev
   ```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev:local` | Start local development with Docker PostgreSQL |
| `npm run dev` | Start server only (for development server with remote DB) |
| `npm run dev:clean` | Stop Docker and restart fresh |
| `npm run docker:up` | Start Docker PostgreSQL only |
| `npm run docker:down` | Stop all Docker containers |
| `npm run db:push` | Push database schema changes |
| `npm run db:setup` | Run database migrations |

## Database Configuration

### Local (.env.local with NODE_ENV=local_development)
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/smithai?sslmode=disable
NODE_ENV=local_development
PORT=3000
```

### Development Server (.env.local with NODE_ENV=development)
```env
DATABASE_URL=postgresql://user:password@remote-host:5432/database?sslmode=require
NODE_ENV=development
PORT=3000
```

## Docker Container Details

- **Container Name**: `pjt-smith-postgres`
- **Image**: `postgres:16-alpine`
- **Port**: `5432`
- **Database**: `smithai`
- **Username**: `postgres`
- **Password**: `postgres`
- **Volume**: `pjt-smith-demo_postgres_data`

## Troubleshooting

### Port Already in Use
If port 3000 is already in use, change it in `.env.local`:
```env
PORT=3001
```

### Database Connection Issues
1. Check Docker is running: `docker ps`
2. Check PostgreSQL is ready: `docker exec pjt-smith-postgres pg_isready -U postgres`
3. Restart Docker: `npm run docker:down && npm run docker:up`

### Reset Database
```bash
npm run docker:down
docker volume rm pjt-smith-demo_postgres_data
npm run dev:local
```

## Test Users

The application seeds test users on startup:

- **Admin**: admin@smithai.com / admin123
- **Dental**: dental@smithai.com / admin123
- **Insurance**: insurance@smithai.com / admin123
