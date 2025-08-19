# API Gateway Troubleshooting Guide

## Common Issues and Solutions

### 1. Volume Mount Errors

#### Error:
```
Error response from daemon: failed to populate volume: error while mounting volume
```

#### Solution:
Use Docker-managed volumes instead of bind mounts. The current configuration uses:
```yaml
volumes:
  nats-data:
    driver: local  # Docker manages this
  redis-data:
    driver: local  # Docker manages this
```

If you still have issues:
```bash
# Remove all volumes and start fresh
docker-compose -f docker-compose.prod.yml down -v
docker volume prune
./deploy-simple.sh
```

### 2. NATS MAX_PAYLOAD_EXCEEDED

#### Error:
```
NatsError: MAX_PAYLOAD_EXCEEDED
```

#### Solution:
1. Verify NATS is running with correct configuration:
```bash
curl http://localhost:8222/varz | grep max_payload
# Should show: "max_payload": 52428800
```

2. If not correct, restart NATS:
```bash
docker-compose -f docker-compose.prod.yml restart nats
```

3. Check logs for startup errors:
```bash
docker-compose -f docker-compose.prod.yml logs nats
```

### 3. Connection Issues

#### Error:
```
Error: connect ECONNREFUSED 127.0.0.1:4222
```

#### Solution:
Your .env.production has wrong hostnames. Fix them:
```bash
# In .env.production, change:
NATS_SERVER=nats://localhost:4222  # WRONG
REDIS_HOST=localhost                # WRONG

# To:
NATS_SERVER=nats://nats:4222       # CORRECT (use container name)
REDIS_HOST=redis                    # CORRECT (use container name)
```

Or let docker-compose override them (already configured).

### 4. Services Not Starting

#### Check service health:
```bash
docker-compose -f docker-compose.prod.yml ps
```

#### View logs for specific service:
```bash
docker-compose -f docker-compose.prod.yml logs nats
docker-compose -f docker-compose.prod.yml logs redis
docker-compose -f docker-compose.prod.yml logs api-gateway
```

#### Common causes:
- Port already in use
- Missing environment variables
- Insufficient memory

### 5. Port Conflicts

#### Error:
```
bind: address already in use
```

#### Solution:
Find and stop conflicting services:
```bash
# Check what's using the ports
lsof -i :4222  # NATS
lsof -i :6379  # Redis
lsof -i :80    # API Gateway
lsof -i :8222  # NATS monitoring

# Stop conflicting service or change ports in docker-compose
```

### 6. Memory Issues

#### Symptoms:
- Services crash randomly
- OOM (Out of Memory) errors

#### Solution:
1. Check Docker resources:
```bash
docker system df
docker stats
```

2. Clean up:
```bash
docker system prune -a
docker volume prune
```

3. Increase memory limits in docker-compose if needed.

### 7. Health Check Failures

#### Issue:
Services marked as unhealthy

#### Debug:
```bash
# Check health status
docker inspect api-gateway | jq '.[0].State.Health'

# Run health check manually
docker exec api-gateway wget --spider http://localhost:80/health
docker exec nats wget --spider http://localhost:8222/healthz
docker exec redis redis-cli ping
```

### 8. File Upload Still Failing

#### After fixing NATS configuration, if uploads still fail:

1. Verify all services have the new configuration:
```bash
# Check NATS client in API Gateway
docker exec api-gateway env | grep NATS
# Should show: NATS_MAX_PAYLOAD=52428800

# Check actual NATS server
curl http://localhost:8222/varz | jq '.max_payload'
# Should show: 52428800
```

2. Test with smaller file first:
```bash
# Create 1MB test file
dd if=/dev/zero of=test.bin bs=1M count=1

# Try upload
curl -X POST http://localhost/api/v1/tasks/{task-id}/files/upload \
  -H "Authorization: Bearer {token}" \
  -F "file=@test.bin"
```

3. Check task microservice is also updated with max payload configuration.

### 9. Logs Not Visible

#### Issue:
Can't see NATS logs

#### Solution:
NATS logs are now sent to stdout instead of file:
```bash
# View NATS logs
docker-compose -f docker-compose.prod.yml logs -f nats

# For timestamps and debug info, we use -DV flag
# D = Debug, V = Verbose, T = Timestamps
```

### 10. Clean Start Procedure

If nothing works, do a clean start:

```bash
# 1. Stop everything
docker-compose -f docker-compose.prod.yml down

# 2. Remove volumes
docker volume rm api-gateway_nats-data api-gateway_redis-data 2>/dev/null || true

# 3. Remove old containers
docker container prune -f

# 4. Pull fresh images
docker-compose -f docker-compose.prod.yml pull

# 5. Rebuild
docker-compose -f docker-compose.prod.yml build --no-cache

# 6. Start fresh
docker-compose -f docker-compose.prod.yml up -d

# 7. Check logs
docker-compose -f docker-compose.prod.yml logs -f
```

## Quick Diagnostic Commands

```bash
# Check all services
docker-compose -f docker-compose.prod.yml ps

# Check NATS config
curl -s http://localhost:8222/varz | jq '{max_payload, max_connections, port}'

# Check Redis
docker exec redis redis-cli info server

# Check API Gateway
curl http://localhost/health

# View all logs
docker-compose -f docker-compose.prod.yml logs --tail=50

# Check resource usage
docker stats --no-stream
```

## Getting Help

1. Check service logs first
2. Verify environment variables
3. Ensure ports are available
4. Check Docker has enough resources
5. Try the clean start procedure

If issues persist, collect:
- Output of `docker-compose -f docker-compose.prod.yml ps`
- Recent logs: `docker-compose -f docker-compose.prod.yml logs --tail=100`
- Environment check: `docker-compose -f docker-compose.prod.yml config`