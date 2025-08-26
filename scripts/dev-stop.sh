#!/bin/bash

# Voice-Powered RAG FAQ Agent - Development Stop Script
# This script stops the development environment

set -e

echo "🛑 Stopping Voice-Powered RAG FAQ Agent Development Environment"
echo "================================================================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running."
    exit 1
fi

# Stop all services
echo "🔄 Stopping all services..."
docker-compose down

# Optional: Remove volumes (uncomment if you want to reset data)
# echo "🗑️  Removing volumes..."
# docker-compose down -v

echo ""
echo "📊 Remaining containers:"
docker-compose ps

echo ""
echo "✅ Development environment stopped successfully!"
echo ""
echo "💡 To remove all data (databases, etc.), run:"
echo "   docker-compose down -v"
echo ""
echo "💡 To clean up Docker resources, run:"
echo "   docker system prune"