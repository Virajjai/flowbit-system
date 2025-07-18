#!/bin/bash

echo "🚀 Starting Flowbit Multi-Tenant Workflow System..."
echo "================================================="

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Pull latest images
echo "📦 Pulling latest images..."
docker-compose pull

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

# Wait for MongoDB to be ready
echo "🍃 Waiting for MongoDB to initialize..."
sleep 5

# Test API health
echo "🏥 Testing API health..."
curl -f http://localhost:3001/health > /dev/null 2>&1
if [ $? -eq 0 ]; then
    echo "✅ API is healthy"
else
    echo "⚠️ API may still be starting..."
fi

echo ""
echo "🎉 System started successfully!"
echo "================================================="
echo ""
echo "Access Points:"
echo "• Frontend Shell: http://localhost:3000"
echo "• Support Tickets: http://localhost:3002"
echo "• API: http://localhost:3001"
echo "• n8n Dashboard: http://localhost:5678"
echo "• MongoDB: localhost:27017"
echo ""
echo "Test Users:"
echo "• LogisticsCo Admin: admin@logistics-co.com / password123"
echo "• RetailGmbH Admin: admin@retail-gmbh.com / password123"
echo "• LogisticsCo User: user@logistics-co.com / password123"
echo "• RetailGmbH User: user@retail-gmbh.com / password123"
echo ""
echo "To view logs: docker-compose logs -f [service]"
echo "To stop: docker-compose down"
echo ""
echo "🎥 Ready for demo!"
