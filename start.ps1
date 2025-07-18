Write-Host "🚀 Starting Flowbit Multi-Tenant Workflow System..." -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker first." -ForegroundColor Red
    exit 1
}

# Check if Docker Compose is available
try {
    docker-compose --version | Out-Null
    Write-Host "✅ Docker Compose is available" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker Compose not found. Please install Docker Compose." -ForegroundColor Red
    exit 1
}

# Stop any existing containers
Write-Host "🛑 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Pull latest images
Write-Host "📦 Pulling latest images..." -ForegroundColor Yellow
docker-compose pull

# Build and start services
Write-Host "🏗️ Building and starting services..." -ForegroundColor Yellow
docker-compose up -d --build

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check service status
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
docker-compose ps

# Wait for MongoDB to be ready
Write-Host "🍃 Waiting for MongoDB to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Test API health
Write-Host "🏥 Testing API health..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method Get -TimeoutSec 5
    Write-Host "✅ API is healthy" -ForegroundColor Green
} catch {
    Write-Host "⚠️ API may still be starting..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 System started successfully!" -ForegroundColor Green
Write-Host "=================================================" -ForegroundColor Green
Write-Host ""
Write-Host "Access Points:" -ForegroundColor Cyan
Write-Host "• Frontend Shell: http://localhost:3000" -ForegroundColor White
Write-Host "• Support Tickets: http://localhost:3002" -ForegroundColor White
Write-Host "• API: http://localhost:3001" -ForegroundColor White
Write-Host "• n8n Dashboard: http://localhost:5678" -ForegroundColor White
Write-Host "• MongoDB: localhost:27017" -ForegroundColor White
Write-Host ""
Write-Host "Test Users:" -ForegroundColor Cyan
Write-Host "• LogisticsCo Admin: admin@logistics-co.com / password123" -ForegroundColor White
Write-Host "• RetailGmbH Admin: admin@retail-gmbh.com / password123" -ForegroundColor White
Write-Host "• LogisticsCo User: user@logistics-co.com / password123" -ForegroundColor White
Write-Host "• RetailGmbH User: user@retail-gmbh.com / password123" -ForegroundColor White
Write-Host ""
Write-Host "To view logs: docker-compose logs -f [service]" -ForegroundColor Yellow
Write-Host "To stop: docker-compose down" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎥 Ready for demo!" -ForegroundColor Green
