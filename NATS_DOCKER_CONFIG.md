# NATS Docker Configuration Reference

## Command Line Options

NATS server supports various command line flags. Here are the most commonly used ones:

### Correct Syntax for Docker Compose

```yaml
# Option 1: Using short flags
command: ["-m", "52428800"]  # -m for max_payload

# Option 2: Using config file
command: ["-c", "/etc/nats/nats-server.conf"]

# Option 3: Combining both
command: ["-m", "52428800", "-c", "/etc/nats/nats-server.conf"]

# Option 4: Multiple flags
command: [
  "-p", "4222",           # Port
  "-m", "52428800",       # Max payload (50MB)
  "-n", "my-nats-server"  # Server name
]
```

### Common NATS Server Flags

| Short | Long | Description | Example |
|-------|------|-------------|---------|
| `-p` | `--port` | Client port | `-p 4222` |
| `-m` | `--max_payload` | Max message size | `-m 52428800` |
| `-c` | `--config` | Config file path | `-c /etc/nats/nats.conf` |
| `-D` | `--debug` | Enable debug output | `-D` |
| `-V` | `--trace` | Enable trace output | `-V` |
| `-DV` | | Debug and trace | `-DV` |
| `-l` | `--log` | Log file path | `-l /var/log/nats.log` |
| `-T` | `--logtime` | Add timestamps to log | `-T` |
| `-s` | `--syslog` | Enable syslog | `-s` |
| `-r` | `--remote_syslog` | Remote syslog address | `-r udp://localhost:514` |
| `-P` | `--pid` | PID file | `-P /var/run/nats.pid` |
| `-n` | `--server_name` | Server name | `-n my-server` |
| `-a` | `--addr` | Bind address | `-a 0.0.0.0` |

## Environment Variables vs Command Line

**Important**: NATS server does NOT read environment variables directly. The environment variables in docker-compose are for documentation or for use by wrapper scripts.

### ❌ This does NOT work:
```yaml
environment:
  - NATS_MAX_PAYLOAD=52428800  # NATS ignores this
```

### ✅ This DOES work:
```yaml
command: ["-m", "52428800"]  # Direct command line flag
```

## Working Docker Compose Examples

### Simple Configuration
```yaml
services:
  nats:
    image: nats:2.10-alpine
    ports:
      - "4222:4222"
    command: ["-m", "52428800"]  # 50MB max payload
```

### With Monitoring
```yaml
services:
  nats:
    image: nats:2.10-alpine
    ports:
      - "4222:4222"
      - "8222:8222"
    command: ["-m", "52428800", "-p", "4222", "-http_port", "8222"]
```

### With Config File
```yaml
services:
  nats:
    image: nats:2.10-alpine
    ports:
      - "4222:4222"
    command: ["-c", "/etc/nats/nats.conf"]
    volumes:
      - ./nats-server.conf:/etc/nats/nats.conf:ro
```

### Production Setup
```yaml
services:
  nats:
    image: nats:2.10-alpine
    container_name: nats
    ports:
      - "4222:4222"
      - "8222:8222"
    command: [
      "-p", "4222",
      "-m", "52428800",
      "-http_port", "8222",
      "-T"  # Add timestamps to logs
    ]
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "nc", "-z", "localhost", "4222"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## Verifying Configuration

### Check Max Payload Setting
```bash
# Using monitoring endpoint
curl -s http://localhost:8222/varz | jq '.max_payload'

# Using nats CLI
nats server info --server=nats://localhost:4222

# Check in container logs
docker logs nats | grep max_payload
```

### Test with Large Message
```bash
# Create a test file
dd if=/dev/zero of=test.bin bs=1M count=40

# Try to publish (should work with 50MB limit)
cat test.bin | base64 | nats pub test.subject

# This should fail if file is too large
dd if=/dev/zero of=large.bin bs=1M count=60
cat large.bin | base64 | nats pub test.subject
```

## Troubleshooting

### Error: "flag provided but not defined: -max_payload"
**Cause**: Using wrong syntax `--max_payload` instead of `-m`
**Solution**: Use `-m 52428800`

### Error: "MAX_PAYLOAD_EXCEEDED"
**Cause**: Message exceeds configured limit
**Solution**: 
1. Verify NATS is running with increased limit
2. Check both client and server configurations
3. Remember base64 encoding adds ~33% overhead

### NATS Not Starting
**Check**:
```bash
# View container logs
docker logs nats

# Test configuration file
docker run --rm -v $(pwd)/nats-server.conf:/etc/nats/nats.conf:ro nats:2.10-alpine -c /etc/nats/nats.conf -t

# Check port availability
lsof -i :4222
```

## Best Practices

1. **Always verify configuration** after starting NATS:
   ```bash
   curl http://localhost:8222/varz | grep max_payload
   ```

2. **Use monitoring port** (8222) for health checks and debugging

3. **Set limits appropriately**:
   - Consider base64 overhead (~33%)
   - Leave buffer for message metadata
   - Monitor memory usage with large payloads

4. **For production**:
   - Use config file for complex setups
   - Enable logging with timestamps
   - Configure health checks
   - Set resource limits in Docker

## Your Current Setup

Based on your .env.production file, make sure to:

1. **Update NATS_SERVER** in .env.production:
   ```
   NATS_SERVER=nats://nats:4222  # 'nats' is the container name
   ```
   Not `localhost` when running in Docker!

2. **Use the corrected docker-compose.prod.yml** with:
   ```yaml
   command: ["-m", "52428800"]
   ```

3. **Restart services**:
   ```bash
   docker-compose -f docker-compose.prod.yml down
   docker-compose -f docker-compose.prod.yml up -d
   ```

4. **Verify**:
   ```bash
   curl http://localhost:8222/varz | grep max_payload
   # Should show: "max_payload": 52428800
   ```