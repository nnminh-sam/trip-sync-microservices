#!/bin/bash

# Prepare Docker volumes for production deployment

echo "📁 Preparing Docker volumes..."

# Docker will automatically create named volumes
echo "✅ Using Docker-managed volumes:"
echo "   - nats-data (for NATS persistence)"
echo "   - nats-logs (for NATS logs)"
echo "   - redis-data (for Redis persistence)"

# Create local backup directory for volume exports
mkdir -p backups

# Add to .gitignore if not already there
if ! grep -q "backups/" .gitignore 2>/dev/null; then
    echo "" >> .gitignore
    echo "# Backup directory" >> .gitignore
    echo "backups/" >> .gitignore
    echo "✅ Added backups/ to .gitignore"
fi

echo ""
echo "📝 Volume management commands:"
echo "   List volumes:    docker volume ls"
echo "   Inspect volume:  docker volume inspect api-gateway_nats-data"
echo "   Backup volume:   docker run --rm -v api-gateway_redis-data:/data -v \$(pwd)/backups:/backup alpine tar czf /backup/redis-\$(date +%Y%m%d).tar.gz -C /data ."
echo ""
echo "🎉 Volume preparation complete!"