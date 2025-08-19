# NATS Configuration Guide for File Upload

## Problem
The default NATS server configuration has a maximum payload size of 1MB, which causes `MAX_PAYLOAD_EXCEEDED` errors when uploading files. Files encoded in base64 increase in size by approximately 33%, so a 2.4MB image becomes ~3.2MB, exceeding the default limit.

## Solution
We've configured NATS to support larger payloads (up to 50MB) to handle file uploads.

## Configuration Changes

### 1. NATS Server Configuration (`nats-server.conf`)
- Set `max_payload: 52428800` (50MB)
- This is the server-side limit for message size

### 2. API Gateway (`api-gateway/src/client/clients.ts`)
- Added `maxPayload: 50 * 1024 * 1024` to NATS client options
- Added file size validation before base64 encoding
- Prevents sending files that would exceed NATS limits

### 3. Task Microservice (`task-micro/src/main.ts`)
- Added `maxPayload: 50 * 1024 * 1024` to microservice options
- Ensures the service can receive large messages

## Starting NATS with Custom Configuration

### Option 1: Using Docker (Recommended)
```bash
# Start NATS with custom configuration
./start-nats.sh

# Or manually:
docker-compose -f docker-compose.nats.yml up -d
```

### Option 2: Using Local NATS Server
```bash
# Start with configuration file
nats-server -c nats-server.conf

# Or with command line flag
nats-server --max_payload 52428800
```

### Option 3: Modify Existing Docker Compose
If you have an existing NATS service in docker-compose, update it:

```yaml
services:
  nats:
    image: nats:2.10-alpine
    ports:
      - "4222:4222"
    command: ["--max_payload", "52428800"]  # 50MB
    # OR use config file:
    # command: ["-c", "/etc/nats/nats-server.conf"]
    # volumes:
    #   - ./nats-server.conf:/etc/nats/nats-server.conf:ro
```

## File Size Limits

### Current Limits:
- **NATS Transport**: 50MB (after base64 encoding)
- **Actual File Size**: ~36MB (before base64 encoding)
- **API Gateway Safety**: 100MB (prevents memory issues)
- **GCS Business Logic**: 10MB (configurable in task service)

### Size Calculation:
- Base64 encoding increases size by ~33%
- Formula: `base64_size = file_size * 1.37`
- Safety buffer: 10% reserved for message metadata

## Monitoring

### Check NATS Server Status:
```bash
# View server configuration
curl http://localhost:8222/varz | jq '.max_payload'

# Monitor connections
curl http://localhost:8222/connz

# Check server stats
curl http://localhost:8222/statsz
```

### View Logs:
```bash
# Docker logs
docker logs trip-sync-nats

# Local server logs
tail -f /var/log/nats-server.log
```

## Troubleshooting

### Error: MAX_PAYLOAD_EXCEEDED
**Cause**: File exceeds NATS payload limit after base64 encoding

**Solutions**:
1. Ensure NATS server is running with increased limits
2. Verify both client and server have matching `maxPayload` settings
3. Check file size before upload (must be < 36MB)

### Error: File too large for NATS transport
**Cause**: Gateway pre-validation prevents oversized files

**Solutions**:
1. Reduce file size before upload
2. Consider implementing chunked uploads for very large files
3. Use direct GCS uploads with signed URLs for large files

### Verify Configuration:
```bash
# Check if NATS accepts large payloads
echo "Test message" | nats pub test.subject --max-payload=52428800

# Test with actual file
base64 /path/to/test-file.pdf | nats pub test.file --max-payload=52428800
```

## Best Practices

1. **File Size Validation**: Always validate file size at the gateway before encoding
2. **Error Handling**: Provide clear error messages for size limit violations
3. **Monitoring**: Monitor NATS memory usage with large payloads
4. **Alternative for Large Files**: Consider implementing:
   - Direct upload to GCS using signed URLs
   - Chunked file upload mechanism
   - Streaming uploads for very large files

## Production Considerations

1. **Memory Usage**: Large payloads increase memory consumption
   - Monitor NATS server memory
   - Set appropriate container memory limits
   
2. **Network Bandwidth**: Large messages impact network performance
   - Consider compression for text files
   - Monitor network throughput
   
3. **Clustering**: In clustered NATS setup, ensure all nodes have same limits

4. **Security**: Large payloads can be used for DoS attacks
   - Implement rate limiting
   - Add authentication/authorization
   - Monitor for abuse

## Alternative Solutions

For files larger than 36MB, consider:

1. **Direct GCS Upload**: 
   - Generate signed upload URL
   - Client uploads directly to GCS
   - Notify backend after upload

2. **Chunked Upload**:
   - Split file into chunks
   - Upload chunks sequentially
   - Reassemble in GCS

3. **Streaming**:
   - Use NATS JetStream for large file streaming
   - Implement resumable uploads