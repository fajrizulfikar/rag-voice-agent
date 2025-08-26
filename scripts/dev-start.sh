#!/bin/bash

# Voice-Powered RAG FAQ Agent - Development Startup Script
# This script sets up and starts the development environment

set -e

echo "🚀 Starting Voice-Powered RAG FAQ Agent Development Environment"
echo "================================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose."
    exit 1
fi

# Create .env.development if it doesn't exist
if [ ! -f .env.development ]; then
    echo "📋 Creating .env.development from template..."
    cp .env.example .env.development
    echo "⚠️  Please edit .env.development and add your API keys before continuing."
    echo "   Required: OPENAI_API_KEY, GOOGLE_CLOUD_PROJECT_ID"
    read -p "Press Enter to continue after editing the environment file..."
fi

# Check for required environment variables
if ! grep -q "OPENAI_API_KEY=sk-" .env.development 2>/dev/null; then
    echo "⚠️  Warning: OPENAI_API_KEY not set in .env.development"
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p ./backend/src/migrations
mkdir -p ./ssl

# Build and start services
echo "🔨 Building and starting services..."
export COMPOSE_FILE=docker-compose.yml

# Start database services first
echo "🗄️  Starting database services..."
docker-compose up -d postgres qdrant redis

# Wait for databases to be ready
echo "⏳ Waiting for databases to be ready..."
timeout=60
counter=0
while [ $counter -lt $timeout ]; do
    if docker-compose exec -T postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo "✅ PostgreSQL is ready"
        break
    fi
    echo "   Waiting for PostgreSQL... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

# Check Qdrant health
counter=0
while [ $counter -lt $timeout ]; do
    if curl -f http://localhost:6333/health > /dev/null 2>&1; then
        echo "✅ Qdrant is ready"
        break
    fi
    echo "   Waiting for Qdrant... ($counter/$timeout)"
    sleep 2
    counter=$((counter + 2))
done

# Start application services
echo "🚀 Starting application services..."
docker-compose up -d backend frontend

# Wait a moment for services to start
sleep 5

# Display service status
echo ""
echo "📊 Service Status:"
echo "=================="
docker-compose ps

echo ""
echo "🌐 Service URLs:"
echo "================"
echo "Frontend:      http://localhost:3001"
echo "Backend API:   http://localhost:3000"
echo "Health Check:  http://localhost:3000/health"
echo "Qdrant UI:     http://localhost:6333/dashboard"
echo ""

# Check service health
echo "🏥 Health Checks:"
echo "=================="

# Check backend health
if curl -f http://localhost:3000/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy"
else
    echo "⚠️  Backend health check failed - service may still be starting"
fi

# Check frontend
if curl -f http://localhost:3001 > /dev/null 2>&1; then
    echo "✅ Frontend is responding"
else
    echo "⚠️  Frontend check failed - service may still be starting"
fi

echo ""
echo "🎉 Development environment started successfully!"
echo ""
echo "💡 Useful commands:"
echo "   View logs:         docker-compose logs -f"
echo "   Stop services:     docker-compose down"
echo "   Restart service:   docker-compose restart <service>"
echo "   Database shell:    docker-compose exec postgres psql -U postgres -d rag_voice_db"
echo ""
echo "📚 For more information, see DOCKER.md"