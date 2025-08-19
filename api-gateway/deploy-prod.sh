#!/bin/bash

# API Gateway Production Deployment Script

set -e  # Exit on error

echo "🚀 Starting API Gateway Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Prepare volumes
echo -e "${BLUE}📁 Preparing volumes...${NC}"
./prepare-volumes.sh

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please copy .env.production.example to .env.production and configure it."
    exit 1
fi

# Fix NATS_SERVER if it points to localhost
if grep -q "NATS_SERVER=nats://localhost" .env.production; then
    echo -e "${YELLOW}⚠️  Fixing NATS_SERVER to use container name...${NC}"
    sed -i.bak 's|NATS_SERVER=nats://localhost|NATS_SERVER=nats://nats|g' .env.production
    echo -e "${GREEN}✅ NATS_SERVER updated to nats://nats:4222${NC}"
fi

# Validate environment variables
echo "📋 Validating environment configuration..."
required_vars=("NATS_SERVER" "JWT_SECRET")
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.production; then
        echo -e "${RED}❌ Error: ${var} not configured in .env.production${NC}"
        exit 1
    fi
done

# Build the Docker image
echo "🔨 Building Docker image..."
docker-compose -f docker-compose.prod.yml build --no-cache api-gateway

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker-compose -f docker-compose.prod.yml down

# Start services
echo "🚀 Starting services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 5

# Check NATS
echo "🔍 Checking NATS server..."
if curl -s http://localhost:8222/varz > /dev/null; then
    echo -e "${GREEN}✅ NATS is running${NC}"
    
    # Check max payload configuration
    max_payload=$(curl -s http://localhost:8222/varz | grep -o '"max_payload":[0-9]*' | cut -d':' -f2)
    if [ "$max_payload" = "52428800" ]; then
        echo -e "${GREEN}✅ NATS max_payload correctly set to 50MB${NC}"
    else
        echo -e "${YELLOW}⚠️  Warning: NATS max_payload is ${max_payload} bytes (expected 52428800)${NC}"
    fi
else
    echo -e "${RED}❌ NATS is not responding${NC}"
fi

# Check Redis
echo "🔍 Checking Redis..."
if docker exec redis redis-cli ping > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Redis is running${NC}"
else
    echo -e "${RED}❌ Redis is not responding${NC}"
fi

# Check API Gateway
echo "🔍 Checking API Gateway..."
sleep 10  # Give API Gateway more time to start
if curl -s -f http://localhost/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ API Gateway is running${NC}"
else
    echo -e "${YELLOW}⚠️  API Gateway health check failed (may still be starting)${NC}"
fi

# Show container status
echo ""
echo "📊 Container Status:"
docker-compose -f docker-compose.prod.yml ps

# Show logs command
echo ""
echo "📝 To view logs, run:"
echo "  docker-compose -f docker-compose.prod.yml logs -f"
echo ""
echo "🎯 To test file upload:"
echo "  curl -X POST http://localhost/api/v1/tasks/{task-id}/files/upload \\"
echo "    -H 'Authorization: Bearer {token}' \\"
echo "    -F 'file=@/path/to/file' \\"
echo "    -F 'description=\"Test upload\"'"
echo ""
echo -e "${GREEN}✅ Deployment complete!${NC}"