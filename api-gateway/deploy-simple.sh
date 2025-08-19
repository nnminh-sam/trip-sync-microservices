#!/bin/bash

# Simple API Gateway Production Deployment Script

set -e  # Exit on error

echo "🚀 Starting API Gateway Deployment..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Check .env.production
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production not found!${NC}"
    echo "Creating from example..."
    cp .env.production.example .env.production
    echo -e "${YELLOW}⚠️  Please edit .env.production with your settings${NC}"
    exit 1
fi

# Clean up any existing containers
echo "🧹 Cleaning up old containers..."
docker-compose -f docker-compose.prod.yml down 2>/dev/null || true

# Remove problematic volumes if they exist
echo "🗑️  Removing old volumes if needed..."
docker volume rm api-gateway_nats-logs 2>/dev/null || true

# Build services
echo "🔨 Building services..."
docker-compose -f docker-compose.prod.yml build

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services
echo "⏳ Waiting for services to start..."
sleep 10

# Check services
echo ""
echo "📊 Service Status:"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo "🔍 Checking NATS..."
if curl -s http://localhost:8222/varz > /dev/null 2>&1; then
    max_payload=$(curl -s http://localhost:8222/varz | grep -o '"max_payload":[0-9]*' | cut -d':' -f2)
    echo -e "${GREEN}✅ NATS is running (max_payload: ${max_payload} bytes)${NC}"
else
    echo -e "${YELLOW}⚠️  NATS monitoring not responding yet${NC}"
fi

echo ""
echo "🔍 Checking Redis..."
if docker exec redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${YELLOW}⚠️  Redis not responding yet${NC}"
fi

echo ""
echo "🔍 Checking API Gateway..."
if curl -s http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway is running${NC}"
else
    echo -e "${YELLOW}⚠️  API Gateway not responding yet (may still be starting)${NC}"
fi

echo ""
echo "📝 Useful commands:"
echo "  View logs:        docker-compose -f docker-compose.prod.yml logs -f"
echo "  Stop services:    docker-compose -f docker-compose.prod.yml down"
echo "  Restart service:  docker-compose -f docker-compose.prod.yml restart [service]"
echo "  Check NATS:       curl http://localhost:8222/varz | jq '.max_payload'"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"