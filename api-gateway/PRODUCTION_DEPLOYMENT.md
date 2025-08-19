# API Gateway Production Deployment Guide

## Overview
This guide covers the production deployment of the API Gateway with enhanced NATS configuration for file upload support.

## Prerequisites

- Docker & Docker Compose installed
- `.env.production` file configured
- Ports 80, 443, 4222, 6379, 8222 available
- At least 1GB RAM available for containers

## Quick Start

```bash
# 1. Configure environment
cp .env.production.example .env.production
# Edit .env.production with your values

# 2. Deploy
./deploy-prod.sh

# 3. Verify
curl http://localhost/health
```

## Configuration

### Key Configuration Updates

The production docker-compose file has been enhanced with:

1. **NATS Server** (Port 4222)
   - 50MB max payload for file uploads
   - HTTP monitoring on port 8222
   - Persistent data and logs
   - Health checks
   - Timestamped logging

2. **Redis** (Port 6379)
   - Append-only persistence
   - 256MB memory limit
   - LRU eviction policy
   - Health checks

3. **API Gateway** (Port 80/443)
   - Automatic NATS/Redis hostname resolution
   - Resource limits (512MB RAM max)
   - Health endpoint at `/health`
   - Depends on healthy NATS & Redis

### Environment Variables

Critical variables that are automatically handled:

```bash
# These are overridden in docker-compose to use container names
NATS_SERVER=nats://nats:4222  # NOT localhost!
REDIS_HOST=redis               # NOT localhost!
NATS_MAX_PAYLOAD=52428800      # 50MB
NODE_ENV=production
```

## File Upload Configuration

### Limits
- **NATS Transport**: 50MB (after base64 encoding)
- **Actual File Size**: ~36MB (before encoding)
- **Gateway Safety Limit**: 100MB
- **GCS Business Logic**: 10MB (configurable)

### Testing File Upload
```bash
# Get auth token
TOKEN=$(curl -X POST http://localhost/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}' \
  | jq -r '.data.access_token')

# Upload file
curl -X POST http://localhost/api/v1/tasks/{task-id}/files/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/file.pdf" \
  -F "description=Test upload"
```

## Deployment Steps

### 1. Prepare Environment

```bash
# Create and configure .env.production
cp .env.production.example .env.production
nano .env.production

# Key settings to verify:
# - JWT_SECRET (must be secure)
# - GCS credentials configured
# - Database credentials (if used)
```

### 2. Deploy Services

```bash
# Automatic deployment
./deploy-prod.sh

# Or manual steps:
./prepare-volumes.sh
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d
```

### 3. Verify Deployment

```bash
# Check service health
curl http://localhost/health

# Check NATS configuration
curl http://localhost:8222/varz | jq '.max_payload'
# Should show: 52428800

# Check Redis
docker exec redis redis-cli ping
# Should return: PONG

# View logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Monitoring

### Service Health Checks

All services have health checks configured:

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Individual health endpoints
curl http://localhost/health          # API Gateway
curl http://localhost:8222/healthz    # NATS
docker exec redis redis-cli ping      # Redis
```

### Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Individual services
docker-compose -f docker-compose.prod.yml logs -f api-gateway
docker-compose -f docker-compose.prod.yml logs -f nats
docker-compose -f docker-compose.prod.yml logs -f redis

# NATS logs with timestamps
docker exec nats cat /var/log/nats.log
```

### Metrics

```bash
# NATS metrics
curl http://localhost:8222/varz | jq '.'

# Connection info
curl http://localhost:8222/connz | jq '.'

# Subscription info
curl http://localhost:8222/subsz | jq '.'

# Redis info
docker exec redis redis-cli info
```

## Troubleshooting

### Common Issues

#### 1. NATS MAX_PAYLOAD_EXCEEDED
```bash
# Verify NATS configuration
curl http://localhost:8222/varz | grep max_payload
# Should show: "max_payload": 52428800

# If not, restart with correct config
docker-compose -f docker-compose.prod.yml restart nats
```

#### 2. Connection to NATS Failed
```bash
# Check if using correct hostname
grep NATS_SERVER .env.production
# Should be: NATS_SERVER=nats://nats:4222

# Test connection
docker exec api-gateway nc -zv nats 4222
```

#### 3. Redis Connection Issues
```bash
# Check Redis is running
docker exec redis redis-cli ping

# Check memory usage
docker exec redis redis-cli info memory
```

#### 4. Gateway Not Starting
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs api-gateway

# Verify dependencies are healthy
docker-compose -f docker-compose.prod.yml ps
```

## Maintenance

### Backup

```bash
# Backup Redis data
docker exec redis redis-cli BGSAVE
cp docker-volume/redis-data/dump.rdb backup/redis-$(date +%Y%m%d).rdb

# Backup NATS data (if using JetStream)
tar -czf backup/nats-$(date +%Y%m%d).tar.gz docker-volume/nats-data/
```

### Update Services

```bash
# Pull latest images
docker-compose -f docker-compose.prod.yml pull

# Rebuild and restart
docker-compose -f docker-compose.prod.yml build --no-cache
docker-compose -f docker-compose.prod.yml up -d
```

### Clean Up

```bash
# Stop all services
docker-compose -f docker-compose.prod.yml down

# Remove volumes (WARNING: Deletes data!)
docker-compose -f docker-compose.prod.yml down -v

# Clean up old images
docker system prune -a
```

## Resource Management

### Current Limits

- **API Gateway**: 512MB RAM max, 1 CPU
- **Redis**: 256MB RAM max
- **NATS**: No explicit limit (monitor usage)

### Monitoring Resources

```bash
# Real-time stats
docker stats

# Check specific container
docker stats api-gateway

# System resources
docker system df
```

### Scaling

For high load, consider:

1. **Horizontal Scaling**:
   ```yaml
   # Add replicas in docker-compose
   deploy:
     replicas: 3
   ```

2. **Increase Resources**:
   ```yaml
   deploy:
     resources:
       limits:
         memory: 1024M
         cpus: '2.0'
   ```

3. **NATS Clustering**:
   - Use NATS cluster mode for HA
   - Configure on port 6222

## Security Considerations

1. **Use HTTPS in Production**:
   - Configure SSL certificates
   - Update port 443 configuration

2. **Secure Environment Variables**:
   - Use Docker secrets for sensitive data
   - Rotate JWT secrets regularly

3. **Network Security**:
   - Use internal networks for service communication
   - Expose only necessary ports

4. **Rate Limiting**:
   - Configure in .env.production
   - Monitor for abuse

## Performance Optimization

1. **File Upload Optimization**:
   - Consider direct GCS uploads for files > 20MB
   - Implement chunked uploads for very large files

2. **Caching**:
   - Redis is configured with LRU eviction
   - Monitor cache hit rates

3. **Connection Pooling**:
   - Configure appropriate pool sizes
   - Monitor connection usage

## Rollback Procedure

If deployment fails:

```bash
# Stop new deployment
docker-compose -f docker-compose.prod.yml down

# Restore previous version
docker-compose -f docker-compose.prod.yml up -d --force-recreate

# Restore data if needed
cp backup/redis-*.rdb docker-volume/redis-data/dump.rdb
docker-compose -f docker-compose.prod.yml restart redis
```

## Support

For issues:
1. Check logs: `docker-compose -f docker-compose.prod.yml logs`
2. Verify configuration: `./deploy-prod.sh`
3. Test endpoints: `curl http://localhost/health`
4. Review this guide's troubleshooting section