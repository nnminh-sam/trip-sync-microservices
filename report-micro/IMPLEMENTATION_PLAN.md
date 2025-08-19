# Report Service Implementation Plan

## Overview
This document outlines the implementation plan for missing features in the Report microservice based on project requirements.

## Phase 1: Data Models & DTOs Enhancement

### 1.1 Task Report DTO
- **File**: `dtos/task-report.dto.ts`
- **Fields**:
  - `objectives_achieved`: string[]
  - `ongoing_work`: string[]
  - `cancellation_proposals`: { reason: string, evidence: string[] }
  - `evidence_attachments`: { type: 'photo' | 'video', url: string, location: LatLng, timestamp: Date }[]
  - `auto_submission`: boolean
  - `submission_time`: Date

### 1.2 Location Report DTO
- **File**: `dtos/location-report.dto.ts`
- **Fields**:
  - `employee_id`: string
  - `trip_id`: string
  - `locations`: { lat: number, lng: number, timestamp: Date, activity: string }[]
  - `check_in`: { location: LatLng, timestamp: Date }
  - `check_out`: { location: LatLng, timestamp: Date }

### 1.3 Export Configuration DTO
- **File**: `dtos/export-config.dto.ts`
- **Fields**:
  - `format`: 'csv' | 'excel'
  - `include_media`: boolean
  - `date_range`: { from: Date, to: Date }
  - `group_by`: 'day' | 'week' | 'month' | 'trip' | 'employee'

## Phase 2: Service Layer Extensions

### 2.1 Media Handling Service
- **File**: `services/media-handler.service.ts`
- **Responsibilities**:
  - Integration with Google Cloud Storage for media storage
  - Generate signed URLs for media access
  - Handle media metadata (location, timestamp)
  - Validate media types and sizes

### 2.2 Export Service
- **File**: `services/export.service.ts`
- **Responsibilities**:
  - Generate CSV exports using `csv-writer` package
  - Generate Excel exports using `exceljs` package
  - Format data according to export configuration
  - Handle large datasets with streaming

### 2.3 Location Tracking Service
- **File**: `services/location-tracking.service.ts`
- **Responsibilities**:
  - Store and retrieve location history
  - Calculate route paths
  - Detect check-in/check-out events
  - Aggregate location data for reports

### 2.4 Report Aggregation Service
- **File**: `services/report-aggregation.service.ts`
- **Responsibilities**:
  - Aggregate trip statistics (completion rate, duration, delays)
  - Aggregate task statistics (completed, pending, cancelled)
  - Calculate performance metrics
  - Generate summary dashboards

## Phase 3: Controller Endpoints

### 3.1 Task Report Endpoints
```typescript
@MessagePattern('report.task.detailed')
getDetailedTaskReport(tripId, taskId, includeMedia)

@MessagePattern('report.task.submit')
submitTaskReport(taskReport: TaskReportDto)

@MessagePattern('report.task.evidence')
attachEvidence(taskId, evidence: MediaAttachment[])
```

### 3.2 Location Report Endpoints
```typescript
@MessagePattern('report.location.track')
trackLocation(employeeId, location: LatLng)

@MessagePattern('report.location.history')
getLocationHistory(tripId, employeeId, dateRange)

@MessagePattern('report.location.live')
getLiveLocations(tripIds: string[])
```

### 3.3 Export Endpoints
```typescript
@MessagePattern('report.export.trips')
exportTripReport(filter: FilterReportTripDto, config: ExportConfigDto)

@MessagePattern('report.export.tasks')
exportTaskReport(filter: FilterReportTaskDto, config: ExportConfigDto)

@MessagePattern('report.export.aggregate')
exportAggregateReport(dateRange, groupBy, format)
```

### 3.4 Dashboard Endpoints
```typescript
@MessagePattern('report.dashboard.summary')
getDashboardSummary(dateRange, filters)

@MessagePattern('report.dashboard.performance')
getPerformanceMetrics(employeeId?, dateRange)
```

## Phase 4: Database Schema Updates

### 4.1 Task Reports Collection
```javascript
{
  _id: ObjectId,
  task_id: string,
  trip_id: string,
  employee_id: string,
  objectives_achieved: string[],
  ongoing_work: string[],
  cancellation_proposals: {...},
  evidence_attachments: [...],
  submitted_at: Date,
  auto_submitted: boolean
}
```

### 4.2 Location History Collection
```javascript
{
  _id: ObjectId,
  employee_id: string,
  trip_id: string,
  timestamp: Date,
  location: {
    type: "Point",
    coordinates: [lng, lat]
  },
  activity: string,
  accuracy: number
}
```

### 4.3 Report Cache Collection
```javascript
{
  _id: ObjectId,
  report_type: string,
  filters: object,
  generated_at: Date,
  expires_at: Date,
  data: object,
  format: string
}
```

## Phase 5: Integration Requirements

### 5.1 External Services
- **Google Cloud Storage**: Media file storage
- **Redis**: Report caching and real-time location updates
- **MongoDB**: Report data persistence
- **Task Microservice**: Task details and updates
- **Trip Microservice**: Trip information and status

### 5.2 Message Queue Topics
- `report.generate`: Trigger report generation
- `report.export`: Handle export requests
- `location.update`: Real-time location updates
- `media.upload`: Media processing queue

## Phase 6: Implementation Timeline

### Week 1-2: Data Models & DTOs
- Create all DTOs with validation
- Update existing DTOs with new fields
- Create database schemas

### Week 3-4: Core Services
- Implement Media Handler Service
- Implement Location Tracking Service
- Set up GCS integration

### Week 5-6: Export & Aggregation
- Implement Export Service (CSV/Excel)
- Implement Report Aggregation Service
- Add caching layer

### Week 7-8: Controllers & Integration
- Create all controller endpoints
- Integrate with other microservices
- Implement message patterns

### Week 9-10: Testing & Optimization
- Unit tests for all services
- Integration tests
- Performance optimization
- Load testing for exports

## Phase 7: Technical Considerations

### 7.1 Performance
- Implement pagination for large datasets
- Use streaming for file exports
- Cache frequently accessed reports
- Index location data for geo queries

### 7.2 Security
- Validate media file types and sizes
- Implement rate limiting for exports
- Secure media URLs with expiration
- Audit trail for report access

### 7.3 Scalability
- Use worker queues for heavy processing
- Implement horizontal scaling for report generation
- Optimize database queries with proper indexes
- Use CDN for media delivery

## Dependencies to Add

```json
{
  "dependencies": {
    "@google-cloud/storage": "^7.0.0",
    "exceljs": "^4.4.0",
    "csv-writer": "^1.6.0",
    "bull": "^4.11.0",
    "ioredis": "^5.3.0",
    "@turf/turf": "^6.5.0"
  }
}
```

## Environment Variables

```env
# Google Cloud Storage
GCS_BUCKET_NAME=trip-sync-media
GCS_PROJECT_ID=trip-sync-project
GCS_KEY_FILE=./gcs-credentials.json

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Export Settings
MAX_EXPORT_ROWS=50000
EXPORT_TIMEOUT_MS=300000

# Location Tracking
LOCATION_UPDATE_INTERVAL_MS=30000
LOCATION_HISTORY_RETENTION_DAYS=90
```

## Success Metrics

1. **Performance**:
   - Report generation < 5 seconds for standard queries
   - Export processing < 30 seconds for 10,000 records
   - Real-time location updates with < 2 second latency

2. **Reliability**:
   - 99.9% uptime for report endpoints
   - Zero data loss for submitted reports
   - Successful recovery from service interruptions

3. **User Experience**:
   - Support for 5+ export formats
   - Real-time location tracking accuracy within 10 meters
   - Media attachments up to 100MB per report

## Notes

- Prioritize mobile app reporting features (Phase 1-3)
- Ensure backward compatibility with existing endpoints
- Consider implementing GraphQL for flexible report queries
- Plan for internationalization (i18n) in report formats