# GPS Log Module

## Architecture

The GPS Log module is a **microservice** that handles GPS data persistence. It does **NOT** expose HTTP endpoints directly.

### Communication Pattern

1. **API Gateway** (HTTP REST) ← Client Request
   - Receives HTTP GET `/gps/logs?userId=...&tripId=...`
   - Sends NATS RPC call: `gps-log.query`

2. **GPS Microservice** (NATS RPC)
   - Receives RPC call via `@MessagePattern('gps-log.query')`
   - Processes and returns GPS logs
   - Sends response back via NATS

3. **API Gateway** (HTTP REST) ← Response
   - Wraps response in standard format
   - Returns HTTP 200 with GPS logs to client

## Files

- `gps-log.service.ts` - Business logic for querying GPS logs
- `gps-log.controller.ts` - RPC message handlers (NOT HTTP endpoints)
- `gps-log.module.ts` - Module definition
- `gps-log-message.pattern.ts` - RPC message patterns
- `dtos/query-gps-log.dto.ts` - DTO for validation

## Message Pattern

```typescript
@MessagePattern('gps-log.query')
async queryGpsLogs(@Payload() payload: MessagePayloadDto<QueryGpsLogRequest>)
```

## API Gateway Endpoint

**HTTP GET** `GET /gps/logs`

### Query Parameters

- `userId` (required) - UUID of the user
- `tripId` (required) - UUID of the trip
- `beginDate` (optional) - ISO date string
- `endDate` (optional) - ISO date string
- `limit` (optional) - Number of records (default: 100, max: 1000)

### Example Request

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/gps/logs?userId=45a1911a-5557-4048-a80a-26abb14a5de5&tripId=5510671e-66b5-4e13-b756-87fc30629dd8&limit=50&beginDate=2025-12-16&endDate=2025-12-17"
```

### Example Response

```json
{
  "timestamp": "2025-12-17T10:00:00Z",
  "path": "/gps/logs",
  "method": "GET",
  "statusCode": 200,
  "data": [
    {
      "id": "log-uuid",
      "userId": "45a1911a-5557-4048-a80a-26abb14a5de5",
      "tripId": "5510671e-66b5-4e13-b756-87fc30629dd8",
      "latitude": 10.8975989,
      "longitude": 106.8991811,
      "timestamp": "2025-12-17T09:00:00Z",
      "createdAt": "2025-12-17T09:00:05Z",
      "updatedAt": "2025-12-17T09:00:05Z"
    }
  ]
}
```

## Data Flow

```
Client
  ↓
API Gateway Controller
  ├─ Validates JWT token
  ├─ Calls GpsService.queryGpsLogs()
  └─ Sends RPC: gps-log.query
     ↓
GPS Microservice
  ├─ Receives RPC message
  ├─ Calls GpsLogService.queryGpsLogs()
  ├─ Queries database
  └─ Returns GPS logs
     ↓
API Gateway
  ├─ Receives response
  ├─ Wraps in standard format
  └─ Returns HTTP 200
     ↓
Client
```
