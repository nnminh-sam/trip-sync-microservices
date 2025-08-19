#!/bin/bash

# Prepare Docker volumes for production deployment

echo "📁 Preparing Docker volumes..."

# Create volume directories if they don't exist
mkdir -p docker-volume/nats-data
mkdir -p docker-volume/nats-logs
mkdir -p docker-volume/redis-data

# Set proper permissions
chmod 755 docker-volume
chmod 755 docker-volume/nats-data
chmod 755 docker-volume/nats-logs
chmod 755 docker-volume/redis-data

echo "✅ Volume directories created:"
echo "   - docker-volume/nats-data"
echo "   - docker-volume/nats-logs"
echo "   - docker-volume/redis-data"

# Add to .gitignore if not already there
if ! grep -q "docker-volume/" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Docker volumes" >> .gitignore
    echo "docker-volume/" >> .gitignore
    echo "✅ Added docker-volume/ to .gitignore"
fi

echo "🎉 Volume preparation complete!"